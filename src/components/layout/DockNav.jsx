import { useCalibr8 } from "../../context/Calibr8Context";

const DOCK_ITEMS = [
  { id: "home", label: "Today", icon: "📅" },
  { id: "solve", label: "Solve", icon: "💻" },
  { id: "problems", label: "Problems", icon: "📋" },
  { id: "library", label: "Library", icon: "📚" },
  { id: "tracks", label: "Tracks", icon: "🏢" },
  { id: "board", label: "Rankings", icon: "🏆" },
  { id: "me", label: "Profile", icon: "👤" },
  { id: "store", label: "Store", icon: "🛍️" },
];

export function DockNav() {
  const { state, setView, showToast } = useCalibr8();

  if (state.view === "landing") return null;

  const handleClick = (id) => {
    if (state.att?.mode === "strict" && state.att?.active && id !== "solve") {
      showToast("Strict attempt active - finish or abandon first.");
      return;
    }
    setView(id);
  };

  return (
    <aside id="dock">
      {DOCK_ITEMS.map((item) => {
        const isActive = state.view === item.id;
        return (
          <button
            key={item.id}
            data-v={item.id}
            onClick={() => handleClick(item.id)}
            className={isActive ? "on" : ""}
            title={item.label}
          >
            <span>{item.icon}</span>
            <em>{item.label}</em>
          </button>
        );
      })}
    </aside>
  );
}
