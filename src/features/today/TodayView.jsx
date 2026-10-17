import React from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { TIERS, DIFFICULTY_LABELS } from "../../constants";

export function TodayView() {
  const {
    state,
    getTier,
    getTopicRating,
    createQuestion,
    setCurrentQ,
    setView,
    setTopicLevel,
    setLevelModalOpen,
  } = useCalibr8();

  const dailyQ = state.daily || createQuestion(false);
  const stretchQ = state.stretch || createQuestion(true);
  const gaugePct = Math.max(5, Math.min(95, ((state.rating - 700) % 200) / 2));
  const topicsList = Object.keys(state.levels || {});

  const handleOpenDaily = () => {
    setCurrentQ(dailyQ);
    setView("solve");
  };

  const handleOpenStretch = () => {
    setCurrentQ(stretchQ);
    setView("solve");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
        Your Day
      </h1>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Tier Card */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-slate-900/50 p-6 backdrop-blur-xl">
          <h2 className="text-base font-semibold text-white mb-1">
            {state.calibrating ? "Calibrating Rank" : `Tier: ${getTier()}`}
          </h2>
          <div className="relative my-4 h-8 w-full border-b-2 border-slate-500">
            <div
              className="absolute bottom-0 h-6 w-1 bg-cyan-400 transition-all duration-500 shadow-[0_0_12px_#38bdf8]"
              style={{ left: `${state.calibrating ? 10 : gaugePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-3">
            {TIERS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            {state.calibrating
              ? `Rated solves: ${state.solves || 0} / 10. Tier unlocks after 10 clean solves.`
              : `Current hidden rating: ${state.rating}. Daily score represents active milestone mastery.`}
          </p>
        </div>

        {/* Daily Question */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-slate-900/50 p-6 backdrop-blur-xl">
          <h2 className="text-base font-semibold text-white mb-2">
            Daily Challenge
          </h2>
          {state.dailyDone ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-400 font-medium">
                ✓ Completed for today!
              </p>
              <p className="text-xs text-slate-400">
                Keep your momentum rolling with unpenalized stretch challenges.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-white">
                  {dailyQ.title}
                </span>
                <span className="rounded-full border border-blue-400/30 px-2 py-0.5 text-[11px] text-cyan-300">
                  {dailyQ.topic}
                </span>
                <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] text-slate-300">
                  {DIFFICULTY_LABELS[dailyQ.l]}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calibrated for your {dailyQ.topic} rating. Earn {dailyQ.pts}{" "}
                standard points or{" "}
                <b className="text-cyan-300">{dailyQ.pts * 1.5} pts</b> in
                strict mode.
              </p>
              <button
                onClick={handleOpenDaily}
                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:opacity-90"
              >
                Open Question
              </button>
            </div>
          )}
        </div>

        {/* Stretch Chain */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/40 p-6 backdrop-blur-xl">
          <h2 className="text-base font-semibold text-white mb-2">
            Stretch Questions
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Optional. Failing incurs zero rating drops or streak losses.
          </p>
          {state.dailyDone ? (
            <button
              onClick={handleOpenStretch}
              className="rounded-full border border-blue-400/40 px-4 py-2 text-xs font-medium text-cyan-300 hover:bg-blue-500/10"
            >
              Take Stretch Question ({stretchQ.title})
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              Unlocks after daily question completion.
            </span>
          )}
        </div>

        {/* Topic Adjuster */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/40 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">
              Your Difficulty Targets
            </h2>
            <button
              onClick={() => setLevelModalOpen(true)}
              className="text-xs text-blue-400 hover:underline"
            >
              Edit Topics
            </button>
          </div>
          <div className="space-y-3">
            {topicsList.map((topic) => (
              <div key={topic}>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{topic}</span>
                  <span className="font-semibold text-cyan-400">
                    {DIFFICULTY_LABELS[state.levels[topic]]}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  value={state.levels[topic]}
                  onChange={(e) => setTopicLevel(topic, Number(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
