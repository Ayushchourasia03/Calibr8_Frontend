import { useCalibr8 } from "../../context/Calibr8Context";
import { TOPS, DIFFICULTY_LABELS } from "../../data/constants";

export function LevelModal() {
  const {
    state,
    setState,
    activeModal,
    setActiveModal,
    setTopicLevel,
    showToast,
  } = useCalibr8();

  if (activeModal !== "level") return null;

  const close = () => setActiveModal(null);
  const L = state.levels || {};

  const handleStartFromScratch = () => {
    setState((s) => ({
      ...s,
      levels: { Arrays: 0, Strings: 0 },
      ratings: { Arrays: 800, Strings: 800 },
      rating: 800,
    }));
  };

  const handleSave = () => {
    if (!Object.keys(L).length) {
      showToast("Please choose at least one topic.");
      return;
    }
    close();
    showToast("Topics & levels updated successfully.");
  };

  return (
    <div className="modal" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close}>
          ×
        </button>

        <h2>Set levels for each topic</h2>
        <p className="mu" style={{ margin: "4px 0 14px" }}>
          Tap a topic to add or remove it, then pick your comfortable level. No tests: Calibr8 adapts as you solve.
        </p>

        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "10px 14px" }}>
          <div>
            <b>Just starting out?</b>
            <div className="mu" style={{ fontSize: "12px" }}>
              Start from scratch with Arrays and Strings on Easy.
            </div>
          </div>
          <button
            className="btn ghost"
            style={{ fontSize: "12px", padding: "4px 10px" }}
            onClick={handleStartFromScratch}
          >
            Start from Scratch
          </button>
        </div>

        {/* Topic Toggle Chips */}
        <div className="chips">
          {TOPS.map((t) => {
            const hasTopic = t in L;
            return (
              <button
                key={t}
                onClick={() => {
                  if (hasTopic) {
                    setTopicLevel(t, null);
                  } else {
                    setTopicLevel(t, 0);
                  }
                }}
                className={`chip ${hasTopic ? "on" : ""}`}
              >
                {t} {hasTopic && "✓"}
              </button>
            );
          })}
        </div>

        {/* Level Pickers for Active Topics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "14px 0" }}>
          {Object.keys(L).map((t) => {
            const currentLvl = L[t];
            return (
              <div key={t} className="tr">
                <b>{t}</b>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[0, 1, 2].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setTopicLevel(t, lvl)}
                      className={`pill ${currentLvl === lvl ? "on" : ""}`}
                      style={{ fontSize: "11px", padding: "3px 8px" }}
                    >
                      {DIFFICULTY_LABELS[lvl]}
                    </button>
                  ))}
                  <button
                    onClick={() => setTopicLevel(t, null)}
                    className="btn ghost"
                    style={{ fontSize: "11px", padding: "3px 6px", color: "var(--bad)" }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="btn"
          style={{ width: "100%", marginTop: "10px" }}
          onClick={handleSave}
        >
          Save Calibration
        </button>
      </div>
    </div>
  );
}
