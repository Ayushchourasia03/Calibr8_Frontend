import { useCalibr8 } from "../../context/Calibr8Context";

export function Header() {
  const { state, getTier, setView, user, setAuthModalOpen, setAuthMode, logout } = useCalibr8();

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

      <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-slate-400">
        <div>
          Tier:{" "}
          <b className="text-white font-semibold">
            {state.calibrating ? "Calibrating" : getTier()}
          </b>
        </div>
        <div className="hidden sm:block">
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

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <button
              onClick={() => setView("me")}
              className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white transition font-medium"
              title="View Profile"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/40 border border-blue-400/40 text-[10px] text-white">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </span>
              <span className="hidden md:inline">{user.name}</span>
            </button>
            <button
              onClick={logout}
              className="text-[11px] text-slate-400 hover:text-red-400 transition"
              title="Sign Out"
            >
              Exit
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setAuthMode("login");
              setAuthModalOpen(true);
            }}
            className="rounded-full bg-blue-600/30 border border-blue-400/40 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-blue-600/50 transition"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}