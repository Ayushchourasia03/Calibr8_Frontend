import React from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

const CATEGORIES = [
  "Global",
  "India",
  "State",
  "College",
  "Branch",
  "Batch",
  "Friends",
];

export function RankingsView() {
  const { state, setState, getTier } = useCalibr8();

  const mockUsers = [
    {
      name: "Riya Verma",
      tier: "Nova",
      rating: 1912,
      score: 48210,
      strict: "88%",
    },
    {
      name: "Kabir Singh",
      tier: "Nova",
      rating: 1874,
      score: 46950,
      strict: "74%",
    },
    {
      name: "Ananya Gupta",
      tier: "Flame",
      rating: 1790,
      score: 44120,
      strict: "91%",
    },
    {
      name: "You",
      tier: getTier(),
      rating: state.rating,
      score: state.score,
      strict: "95%",
    },
    {
      name: "Sneha Rao",
      tier: "Flame",
      rating: 1702,
      score: 39870,
      strict: "67%",
    },
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-white">Rankings</h1>
        <p className="text-xs text-slate-400">
          Rankings are calculated via strict-mode verified submissions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setState((s) => ({ ...s, board: cat }))}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              state.board === cat
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "border border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-blue-500/20 bg-slate-900/50 backdrop-blur-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Name</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Score</th>
              <th className="p-3">Strict Rate</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((u, i) => {
              const isMe = u.name === "You";
              return (
                <tr
                  key={u.name}
                  className={`border-b border-slate-900/80 ${
                    isMe ? "bg-blue-600/10 font-semibold text-cyan-300" : ""
                  }`}
                >
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.tier}</td>
                  <td className="p-3">{u.rating}</td>
                  <td className="p-3">{u.score.toLocaleString()}</td>
                  <td className="p-3">{u.strict}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
