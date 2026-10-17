import { useCalibr8 } from "../../context/Calibr8Context";

const DOCK_ITEMS = [
  { key: "home", label: "Today", icon: "📅" },
  { key: "solve", label: "Solve", icon: "💻" },
  { key: "library", label: "Library", icon: "📚" },
  { key: "tracks", label: "Tracks", icon: "🏢" },
  { key: "board", label: "Rankings", icon: "🏆" },
  { key: "me", label: "Profile", icon: "👤" },
  { key: "store", label: "Store", icon: "🛍️" },
];

export function DockNav() {
  const { state, setView } = useCalibr8();

  if (state.view === "landing") return null;

  return (
    <aside className="fixed bottom-3 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-4 z-40 flex md:flex-col items-center gap-2 rounded-2xl md:rounded-3xl border border-blue-500/20 bg-slate-900/80 p-2 backdrop-blur-2xl shadow-[0_15px_40px_-10px_rgba(47,139,255,0.5)]">
      {DOCK_ITEMS.map(({ key, label, icon }) => {
        const isActive = state.view === key;
        return (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`group relative flex h-12 w-12 md:h-14 md:w-14 flex-col items-center justify-center rounded-xl md:rounded-2xl transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30 scale-105"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-lg md:text-xl">{icon}</span>
            <span className="text-[10px] font-medium leading-none mt-1">
              {label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}