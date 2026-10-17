import { useMemo, useState } from "react";
import { ALL_TOPICS } from "../../constants";
import { useCalibr8 } from "../../context/Calibr8Context";

const LEVEL_LABELS = ["Easy", "Mid", "Hard"];
const LEVEL_VALUES = ["easy", "medium", "hard"];
const LEVEL_RATINGS = [800, 1200, 1600];

export function LevelModal({ isOpen, onClose, isFirstTime = false }) {
  const {
    state,
    setState,
    setView,
    user,
    saveOnboarding,
    apiTopics,
    dsaTopics,
  } = useCalibr8();

  const topicList = useMemo(() => {
    const isDsaTopic = (topic) =>
      topic.category?.toUpperCase() === "DSA" ||
      topic.slug?.toLowerCase().startsWith("dsa");
    const availableTopics = dsaTopics.length
      ? dsaTopics
      : apiTopics.filter(isDsaTopic);

    if (availableTopics.length) return availableTopics;

    return ALL_TOPICS.filter((name) => !["SQL", "Aptitude"].includes(name)).map(
      (name) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        category: "DSA",
      }),
    );
  }, [apiTopics, dsaTopics]);

  const [levelChoices, setLevelChoices] = useState(() => ({ ...state.levels }));
  const levels = Object.fromEntries(
    topicList.map((topic) => [topic.name, levelChoices[topic.name] ?? null]),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const changeLevel = (topicName, lvl) => {
    setLevelChoices((prev) => ({ ...prev, [topicName]: lvl }));
  };

  // Shared by both the preset and the custom save.
  // `chosen` = { [topicName]: 0 | 1 | 2 } covering every topic in topicList.
  const persistCalibration = async (chosen) => {
    const newRatings = {};
    const topicSelections = topicList.map((topic) => {
      const lvlIdx = chosen[topic.name];
      newRatings[topic.name] = LEVEL_RATINGS[lvlIdx];

      return {
        topicId: topic.id,
        difficulty: LEVEL_VALUES[lvlIdx],
      };
    });

    const avgRating = Math.round(
      Object.values(newRatings).reduce((a, b) => a + b, 0) / topicList.length,
    );

    // Call Onboarding API if authenticated
    if (user && topicSelections.length > 0) {
      await saveOnboarding({ topicSelections });
    }

    setState((s) => ({
      ...s,
      levels: chosen,
      ratings: newRatings,
      rating: isFirstTime ? avgRating : s.rating,
      calibrating: isFirstTime ? true : s.calibrating,
      score: isFirstTime ? 0 : s.score,
      started: true,
    }));

    onClose();
    setView("home");
  };

  // Option 1: all topics Easy, save and start immediately
  const handleBeginnerPreset = async () => {
    if (!topicList.length) {
      setError("No DSA topics are available to calibrate.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const allEasy = Object.fromEntries(
        topicList.map((topic) => [topic.name, 0]),
      );
      setLevelChoices(allEasy); // keeps the UI in sync if the save fails
      await persistCalibration(allEasy);
    } catch (err) {
      setError(err.message || "Failed to apply beginner preset.");
    } finally {
      setSaving(false);
    }
  };

  // Option 2: custom per-topic levels
  const handleSave = async () => {
    if (!topicList.length) {
      setError("No DSA topics are available to calibrate.");
      return;
    }

    if (topicList.some((topic) => !Number.isInteger(levels[topic.name]))) {
      setError("Choose Easy, Mid, or Hard for every DSA topic.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await persistCalibration(levels);
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
          <h2 className="text-xl font-bold font-serif mb-1">
            Set Topic Levels & Calibration
          </h2>
          <p className="text-xs text-slate-400">
            Start with every topic on Easy, or choose your level for each DSA
            topic.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Option 1: 1-click beginner preset */}
        <div className="mb-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-blue-900/30 to-cyan-950/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-cyan-300">
                  ⚡ Quick Start: All Easy
                </span>
                <span className="rounded border border-cyan-400/30 bg-cyan-400/20 px-1.5 py-0.5 text-[10px] text-cyan-300">
                  Rating: 800
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300">
                Sets every DSA topic to Easy and starts right away. You can
                change levels later.
              </p>
            </div>
            <button
              type="button"
              disabled={saving || !topicList.length}
              onClick={handleBeginnerPreset}
              className="shrink-0 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Set All Easy & Start"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />
          or choose per topic
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Option 2: per-topic levels */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-xs text-slate-400">
            <span>DSA topics</span>
            <span className="text-[11px]">
              Easy (800) · Mid (1200) · Hard (1600)
            </span>
          </div>

          {topicList.map((topicItem) => {
            const topicName = topicItem.name;
            const currentLevel = levels[topicName];

            return (
              <div
                key={topicItem.id || topicName}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-white/[0.04] p-3 transition"
              >
                <span className="text-sm font-semibold text-white">
                  {topicName}
                </span>

                <div
                  className="flex gap-1.5"
                  role="group"
                  aria-label={`Difficulty for ${topicName}`}
                >
                  {LEVEL_LABELS.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      disabled={saving}
                      onClick={() => changeLevel(topicName, idx)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        currentLevel === idx
                          ? "border border-cyan-400/50 bg-blue-500/30 text-cyan-300"
                          : "border border-white/10 text-slate-400 hover:border-slate-500 hover:text-white"
                      }`}
                      aria-pressed={currentLevel === idx}
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
          className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : isFirstTime
              ? "Start My Journey"
              : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}