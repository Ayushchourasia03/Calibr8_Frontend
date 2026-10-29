import { useCalibr8 } from "../../context/Calibr8Context";

const NAV_ITEMS = [
  { id: "home", label: "Today", icon: "📅" },
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
    <aside id="dock" aria-label="Navigation sidebar">
      {NAV_ITEMS.map((item) => {
        const isActive =
          state.view === item.id ||
          (item.id === "problems" && state.view === "solve");

        return (
          <button
            key={item.id}
            data-k={item.id}
            onClick={() => handleClick(item.id)}
            className={isActive ? "on" : ""}
            aria-label={item.label}
            title={item.label}
          >
            <span role="img" aria-hidden="true">
              {item.icon}
            </span>
            <em>{item.label}</em>
          </button>
        );
      })}
    </aside>
  );
}
