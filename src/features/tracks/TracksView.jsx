import { useCalibr8 } from "../../context/Calibr8Context";
import { HIRING_TRACKS } from "../../data/tracksData";

export function TracksView() {
  const { setActiveModal, setModalData } = useCalibr8();

  const handleOpenTrack = (track) => {
    setActiveModal("track");
    setModalData({ track });
  };

  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <h1>Company Hiring Tracks</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          A ladder of hiring simulation tracks in the style of industry tests. Click any track for full rounds, format and requirements.
        </p>
      </div>

      <div className="grid tk">
        {HIRING_TRACKS.map((track) => {
          const isOpen = track.readiness >= 0.7;
          const pct = Math.round(track.readiness * 100);

          return (
            <div
              key={track.id}
              className="card"
              onClick={() => handleOpenTrack(track)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <h3>{track.name}</h3>
                <span className={`tag ${!isOpen ? "lock" : ""}`}>
                  {isOpen ? "Open" : "Locked (Requires 70%)"}
                </span>
              </div>

              <div className="mu" style={{ marginBottom: "12px", fontSize: "13px" }}>
                {track.subtitle}
              </div>

              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>

              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  marginTop: "10px",
                  fontSize: "12px",
                }}
              >
                <span className="mu">
                  Readiness: <b>{pct}%</b>
                </span>
                <span className="ok" style={{ cursor: "pointer" }}>
                  View Brief & Rounds →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
