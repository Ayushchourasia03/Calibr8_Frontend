import React from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

export function LibraryView() {
  const { state, setState } = useCalibr8();
  const topics = Object.keys(state.topics || {});

  const handleWatchVideo = (topic) => {
    const verified = window.confirm(
      "Concept Check: A sliding window maintains a contiguous subarray of elements. Confirm to complete.",
    );
    if (verified) {
      setState((s) => ({
        ...s,
        videos: { ...s.videos, [topic]: true },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-white">
          Curriculum Library
        </h1>
        <p className="text-xs text-slate-400">
          Complete sample questions (Easy, Medium, Hard) to unlock full topic
          problem archives.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => {
          const count = state.topics[t] || 0;
          const isVideoDone = state.videos?.[t];
          return (
            <div
              key={t}
              className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-5 backdrop-blur-xl space-y-3"
            >
              <h3 className="font-semibold text-white">{t}</h3>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${(count / 6) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Sample Set: {count} / 6</span>
                {count >= 6 && (
                  <span className="text-emerald-400 font-medium">
                    Completed
                  </span>
                )}
              </div>

              {t in (state.videos || {}) && (
                <div className="pt-2 border-t border-slate-800/80">
                  {isVideoDone ? (
                    <span className="text-xs text-emerald-400">
                      ✓ Concept Video Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleWatchVideo(t)}
                      className="rounded-lg border border-blue-500/30 px-3 py-1 text-xs text-cyan-300 hover:bg-blue-500/10"
                    >
                      Watch Concept Video (1x - 1.5x)
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
