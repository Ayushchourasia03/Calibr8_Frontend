import React from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

export function Header() {
  const { state, getTier, setView } = useCalibr8();

  if (state.view === "landing") return null;

  return (
    <header className="sticky top-2 z-30 mx-3 md:mx-auto md:ml-28 max-w-6xl mt-2 flex flex-wrap items-center justify-between gap-4 rounded-full border border-blue-500/30 bg-[#081022]/80 px-6 py-2.5 backdrop-blur-xl shadow-[0_10px_35px_-10px_rgba(47,139,255,0.45)]">
      <div
        onClick={() => setView("landing")}
        className="cursor-pointer text-xl font-bold tracking-tight text-white font-serif"
        title="Back to start"
      >
        Calibr<span className="text-blue-500">8</span>
      </div>

      <div className="flex items-center gap-6 text-xs md:text-sm text-slate-400">
        <div>
          Tier:{" "}
          <b className="text-white font-semibold">
            {state.calibrating ? "Calibrating" : getTier()}
          </b>
        </div>
        <div>
          Score:{" "}
          <b className="text-white font-semibold">
            {state.score.toLocaleString()}
          </b>
        </div>
        <div>
          Coins: <b className="text-amber-400 font-semibold">{state.coins}</b>
        </div>
        <div>
          Streak:{" "}
          <b className="text-orange-400 font-semibold">{state.streak}d</b>
        </div>
      </div>
    </header>
  );
}
