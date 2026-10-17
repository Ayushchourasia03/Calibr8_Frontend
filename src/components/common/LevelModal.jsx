import { useState } from "react";
import { ALL_TOPICS, DIFFICULTY_LABELS } from "../../constants";
import { useCalibr8 } from "../../context/Calibr8Context";

export function LevelModal({ isOpen, onClose, isFirstTime = false }) {
  const {
    state,
    setState,
    setView,
    user,
    saveOnboarding,
    apiTopics,
    dsaTopics
  } = useCalibr8();

  // Combine topics from API or fallback
  const topicList = apiTopics && apiTopics.length > 0
    ? apiTopics
    : ALL_TOPICS.map(name => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name, category: 'DSA' }));

  const [levels, setLevels] = useState(() => {
    if (state.levels && Object.keys(state.levels).length > 0) {
      return { ...state.levels };
    }
    return { Arrays: 0, "DSA - Arrays": 0 };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const toggleTopic = (topicName) => {
    setLevels((prev) => {
      const next = { ...prev };
      if (topicName in next) {
        if (Object.keys(next).length > 1) {
          delete next[topicName];
        }
      } else {
        next[topicName] = 1; // Default to medium if newly activated
      }
      return next;
    });
  };

  const changeLevel = (topicName, lvl) => {
    setLevels((prev) => ({ ...prev, [topicName]: lvl }));
  };

  // 1-Click Beginner Preset
  const handleBeginnerPreset = async () => {
    setError("");
    setSaving(true);
    try {
      const beginnerLevels = {};
      const beginnerRatings = {};

      const dsaList = dsaTopics.length > 0 ? dsaTopics : topicList;
      dsaList.forEach(t => {
        beginnerLevels[t.name] = 0; // easy
        beginnerRatings[t.name] = 800;
      });

      // Also set for ALL_TOPICS if needed
      ALL_TOPICS.forEach(name => {
        beginnerLevels[name] = 0;
        beginnerRatings[name] = 800;
      });

      // API Call: Mode 1 - 1-Click Beginner Preset
      if (user) {
        await saveOnboarding({
          difficulty: "beginner",
          topicIds: "all"
        });
      }

      setState((s) => ({
        ...s,
        levels: beginnerLevels,
        ratings: beginnerRatings,
        rating: 800,
        calibrating: true,
        score: isFirstTime ? 0 : s.score,
        started: true,
      }));

      onClose();
      setView("home");
    } catch (err) {
      setError(err.message || "Failed to set beginner preset.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const keys = Object.keys(levels);
    if (!keys.length) {
      setError("Please select at least 1 topic.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const newRatings = {};
      const topicSelections = [];

      keys.forEach((topicName) => {
        const lvlIdx = levels[topicName] ?? 0;
        const normDiff = ["easy", "medium", "hard"][lvlIdx] || "easy";
        const ratingVal = [800, 1200, 1600][lvlIdx] || 800;

        newRatings[topicName] = ratingVal;

        // Find matching topic in apiTopics if available
        const matchedObj = topicList.find(t => t.name === topicName || t.slug === topicName);
        if (matchedObj) {
          topicSelections.push({
            topicId: matchedObj.id,
            difficulty: normDiff
          });
        }
      });

      const avgRating = Math.round(
        Object.values(newRatings).reduce((a, b) => a + b, 0) / keys.length
      );

      // Call Onboarding API if authenticated
      if (user && topicSelections.length > 0) {
        await saveOnboarding({ topicSelections });
      }

      setState((s) => ({
        ...s,
        levels,
        ratings: newRatings,
        rating: isFirstTime ? avgRating : s.rating,
        calibrating: isFirstTime ? true : s.calibrating,
        score: isFirstTime ? 0 : s.score,
        started: true,
      }));

      onClose();
      setView("home");
    } catch (err) {
      setError(err.message || "Failed to save topic calibrations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-blue-500/30 bg-gradient-to-b from-[#0e162f] to-[#040813] p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg hover:bg-white/10"
        >
          ×
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-bold font-serif mb-1">Set Topic Levels & Calibration</h2>
          <p className="text-xs text-slate-400">
            Tailor your daily questions with calibrated ratings. Choose your current proficiency per topic or apply a 1-click preset.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* 1-Click Beginner Preset Button */}
        <div className="mb-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-blue-900/30 to-cyan-950/40 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-cyan-300">⚡ 1-Click Beginner Preset</span>
                <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-[10px] text-cyan-300 border border-cyan-400/30">
                  Rating: 800
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Instantly configures all DSA topics to Easy (800 baseline rating) for gentle onboarding.
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleBeginnerPreset}
              className="rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 px-3.5 py-1.5 text-xs font-semibold text-cyan-200 transition shrink-0"
            >
              Apply Preset
            </button>
          </div>
        </div>

        {/* Granular topic selectors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
            <span>Select & Calibrate Topics</span>
            <span className="text-[11px]">Easy (800) • Medium (1200) • Hard (1600)</span>
          </div>

          {topicList.map((topicItem) => {
            const topicName = topicItem.name;
            const isSelected = topicName in levels;
            const currentLevel = levels[topicName] ?? 1;

            return (
              <div
                key={topicItem.id || topicName}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition ${
                  isSelected
                    ? "border-blue-500/30 bg-white/[0.04]"
                    : "border-white/5 bg-white/[0.01] opacity-75"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTopic(topicName)}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                        : "border border-white/10 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {topicName}
                  </button>
                  {topicItem.category && (
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                      {topicItem.category}
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5">
                  {DIFFICULTY_LABELS.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      disabled={!isSelected}
                      onClick={() => changeLevel(topicName, idx)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        isSelected && currentLevel === idx
                          ? "bg-blue-500/30 text-cyan-300 border border-cyan-400/50"
                          : "text-slate-400 hover:text-white disabled:opacity-30"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-90 disabled:opacity-50 transition"
        >
          {saving ? "Saving..." : isFirstTime ? "Start My Journey" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}