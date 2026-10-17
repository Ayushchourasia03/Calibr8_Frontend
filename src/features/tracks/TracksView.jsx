import React from "react";

const TRACKS = [
  {
    name: "Service Companies",
    desc: "Capgemini, TCS, Infosys style: Speed, Aptitude, Core DSA",
    readiness: 0.82,
  },
  {
    name: "Mid-Tier Product",
    desc: "Tougher coding, system patterns, and deep CS fundamentals",
    readiness: 0.55,
  },
  {
    name: "Big Tech Style",
    desc: "Hard interview questions, follow-ups, and strict time limits",
    readiness: 0.25,
  },
  {
    name: "Top-Tier Frontier",
    desc: "Netflix, Uber, Google, Staff-level challenge scenarios",
    readiness: 0.08,
  },
];

export function TracksView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-white">
          Company Tracks
        </h1>
        <p className="text-xs text-slate-400">
          Targeted ladder sets that unlock as your readiness threshold crosses
          70%.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {TRACKS.map((trk) => {
          const isOpen = trk.readiness >= 0.7;
          return (
            <div
              key={trk.name}
              className={`rounded-2xl border p-5 backdrop-blur-xl transition ${
                isOpen
                  ? "border-blue-500/30 bg-slate-900/60"
                  : "border-slate-800/60 bg-slate-900/20 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{trk.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isOpen
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isOpen ? "Open" : "Locked (Requires 70%)"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">{trk.desc}</p>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${trk.readiness * 100}%` }}
                />
              </div>
              <span className="mt-2 block text-right text-xs text-slate-400">
                Readiness: {Math.round(trk.readiness * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
