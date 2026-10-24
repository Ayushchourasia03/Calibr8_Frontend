import { useCalibr8 } from "../../context/Calibr8Context";

export function TrackModal() {
  const { activeModal, setActiveModal, modalData, setView } = useCalibr8();

  if (activeModal !== "track" || !modalData?.track) return null;

  const close = () => setActiveModal(null);
  const track = modalData.track;
  const isOpen = track.readiness >= 0.7;
  const pct = Math.round(track.readiness * 100);

  return (
    <div className="modal" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close}>
          ×
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <h2>{track.name}</h2>
          <span className={`tag ${!isOpen ? "lock" : ""}`}>
            {isOpen ? "Open" : "Locked (Requires 70%)"}
          </span>
        </div>
        <p className="mu" style={{ margin: "2px 0 14px" }}>
          {track.subtitle}
        </p>

        <h3>About This Track</h3>
        <p className="mu" style={{ fontSize: "13px", lineHeight: "1.6", margin: "4px 0 14px" }}>
          {track.description}
        </p>

        <h3>Rounds & Format</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "8px 0 14px", borderTop: "1px solid var(--ln)", borderBottom: "1px solid var(--ln)", padding: "10px 0" }}>
          {track.rounds.map(([roundName, timeEstimate], i) => (
            <div key={i} className="tr" style={{ padding: "4px 0", fontSize: "13px" }}>
              <span>
                {i + 1}. {roundName}
              </span>
              <span className="mu" style={{ fontFamily: "monospace", fontSize: "12px" }}>
                {timeEstimate}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
            <span>Your Readiness</span>
            <b>{pct}%</b>
          </div>
          <div className="bar">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>

        <button
          className={`btn ${!isOpen ? "ghost" : ""}`}
          style={{ width: "100%" }}
          disabled={!isOpen}
          onClick={() => {
            close();
            setView("solve");
          }}
        >
          {isOpen ? "Start Hiring Simulation Round 1 →" : "Readiness Below 70% (Locked)"}
        </button>
      </div>
    </div>
  );
}
