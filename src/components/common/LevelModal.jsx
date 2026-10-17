import React, { useState } from "react";
import { ALL_TOPICS, DIFFICULTY_LABELS } from "../../constants";
import { useCalibr8 } from "../../context/Calibr8Context";

export function LevelModal({ isOpen, onClose, isFirstTime = false }) {
  const { state, setState, setView } = useCalibr8();
  const [levels, setLevels] = useState(state.levels || { Arrays: 1 });

  if (!isOpen) return null;

  const toggleTopic = (topic) => {
    setLevels((prev) => {
      const next = { ...prev };
      if (topic in next) {
        if (Object.keys(next).length > 1) delete next[topic];
      } else {
        next[topic] = 1;
      }
      return next;
    });
  };

  const changeLevel = (topic, lvl) => {
    setLevels((prev) => ({ ...prev, [topic]: lvl }));
  };

  const handleSave = () => {
    const keys = Object.keys(levels);
    if (!keys.length) return alert("Select at least one topic.");

    const newRatings = {};
    keys.forEach((t) => {
      newRatings[t] = [800, 1200, 1600][levels[t]];
    });

    const avgRating = Math.round(
      Object.values(newRatings).reduce((a, b) => a + b, 0) / keys.length,
    );

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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-blue-500/30 bg-gradient-to-b from-[#0e162f] to-[#040813] p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg hover:bg-white/10"
        >
          ×
        </button>

        <h2 className="text-xl font-bold font-serif mb-1">Set Topic Levels</h2>
        <p className="text-xs text-slate-400 mb-6">
          Tailor your daily questions. Tap a topic to toggle, then configure
          difficulty. We calibrate your true tier over 10-15 days.
        </p>

        <div className="space-y-3">
          {ALL_TOPICS.map((topic) => {
            const isSelected = topic in levels;
            const currentLevel = levels[topic] ?? 1;
            return (
              <div
                key={topic}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                      : "border border-white/10 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {topic}
                </button>

                <div className="flex gap-1.5">
                  {DIFFICULTY_LABELS.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      disabled={!isSelected}
                      onClick={() => changeLevel(topic, idx)}
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
          className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-90"
        >
          {isFirstTime ? "Start My Journey" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
