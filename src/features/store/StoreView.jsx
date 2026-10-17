import React from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

const THEMES = [
  { id: "default", name: "Default Sapphire", cost: 0 },
  { id: "pixel", name: "Pixel World", cost: 300 },
  { id: "neon", name: "Neon Tactical", cost: 450 },
  { id: "race", name: "Racing Dashboard", cost: 600 },
];

export function StoreView() {
  const { state, setState } = useCalibr8();

  const buyTheme = (theme) => {
    if (state.owned.includes(theme.id)) {
      setState((s) => ({ ...s, theme: theme.id }));
      return;
    }

    if (state.coins < theme.cost) {
      alert("Not enough coins to acquire this theme.");
      return;
    }

    setState((s) => ({
      ...s,
      coins: s.coins - theme.cost,
      owned: [...s.owned, theme.id],
      theme: theme.id,
    }));
  };

  const buyDryRuns = () => {
    if (state.coins < 80) return alert("Requires 80 coins for a 5-pack.");
    setState((s) => ({
      ...s,
      coins: s.coins - 80,
      freeDry: s.freeDry + 5,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-white">Store</h1>
        <p className="text-xs text-slate-400">
          Coins are earned strictly through coding. Money never buys rank or
          ratings.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((th) => {
          const isOwned = state.owned.includes(th.id);
          const isApplied = state.theme === th.id;
          return (
            <div
              key={th.id}
              className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-5 backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-white mb-1">{th.name}</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Cosmetic interface styling & ambiance.
                </p>
              </div>

              <button
                onClick={() => buyTheme(th)}
                className={`w-full rounded-full py-2 text-xs font-semibold transition ${
                  isApplied
                    ? "bg-slate-700 text-slate-300 cursor-default"
                    : isOwned
                      ? "border border-cyan-400 text-cyan-300 hover:bg-cyan-500/10"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {isApplied
                  ? "Applied"
                  : isOwned
                    ? "Apply Theme"
                    : `Buy for ${th.cost} Coins`}
              </button>
            </div>
          );
        })}

        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-5 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white mb-1">5x Dry Run Pack</h3>
            <p className="text-xs text-slate-400 mb-4">
              Get 5 visual stepper executions for relaxed mode.
            </p>
          </div>
          <button
            onClick={buyDryRuns}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 py-2 text-xs font-semibold text-white"
          >
            Buy for 80 Coins
          </button>
        </div>
      </div>
    </div>
  );
}
