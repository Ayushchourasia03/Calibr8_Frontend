import React from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

export function ProfileView() {
  const { state, getTier } = useCalibr8();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-white">
        Social Badges & Verification
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LinkedIn Share Badge */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white mb-4">
            LinkedIn Badge Card
          </h2>
          <div className="rounded-xl bg-gradient-to-br from-[#031433] to-[#0a3a8a] p-5 text-white shadow-xl">
            <div className="text-[10px] font-mono tracking-widest text-cyan-300">
              CALIBR8 CERTIFIED
            </div>
            <h3 className="text-xl font-bold font-serif my-1">
              Candidate Profile
            </h3>
            <div className="text-xs text-slate-200">
              Tier {getTier()} • Rating {state.rating}
            </div>
            <div className="text-xs text-slate-300 mt-2">
              Verified Solves: {state.solves || 0} • Streak: {state.streak} days
            </div>
            <div className="mt-4 inline-block rounded bg-cyan-400/20 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-400/30">
              Strict-Mode Verified
            </div>
          </div>
        </div>

        {/* Instagram Story Clip */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white mb-4">
            Instagram Story Clip
          </h2>
          <div className="mx-auto flex h-60 w-36 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 p-4 text-center text-white shadow-xl">
            <span className="text-xs tracking-wider opacity-80 uppercase">
              Rank Up
            </span>
            <span className="text-xl font-bold my-1">{getTier()}</span>
            <span className="text-[10px] opacity-90">
              {state.streak}-day streak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
