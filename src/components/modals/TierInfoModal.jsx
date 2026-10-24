import { useCalibr8 } from "../../context/Calibr8Context";
import { TIERS, TIER_COLORS, ROMAN_NUMERALS } from "../../data/constants";

export function TierInfoModal() {
  const { state, activeModal, setActiveModal, tierInfo, getTopicRating } =
    useCalibr8();

  if (activeModal !== "tier") return null;

  const close = () => setActiveModal(null);
  const L = state.levels || {};
  const topics = Object.keys(L);

  const getSpotStatus = (topic) => {
    const r = getTopicRating(topic);
    const base = [800, 1200, 1600][L[topic] || 0];
    const diff = r - base;
    if (diff >= 50) return { label: "Good", color: "ok" };
    if (diff <= -50) return { label: "Weak", color: "bad" };
    return { label: "Better", color: "mu" };
  };

  return (
    <div className="modal" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close}>
          ×
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
          <div
            className="badge"
            style={{ "--tc": tierInfo.color, width: "64px", height: "64px", fontSize: "24px" }}
          >
            {state.calibrating ? "?" : ROMAN_NUMERALS[tierInfo.dv]}
          </div>
          <div>
            <h2>{state.calibrating ? "Calibrating" : tierInfo.full}</h2>
            <div className="mu" style={{ fontSize: "13px" }}>
              Overall rating: <b>{state.rating || 1000}</b>.{" "}
              {state.calibrating
                ? `Rated solves ${state.solves || 0} of 10 until tier reveal.`
                : tierInfo.nextAt
                  ? `${tierInfo.nextAt - (state.rating || 1000)} pts to reach ${tierInfo.nextName}.`
                  : "Maximum tier reached!"}
            </div>
          </div>
        </div>

        <h3>The Six Calibr8 Tiers</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "10px 0 16px", borderTop: "1px solid var(--ln)", borderBottom: "1px solid var(--ln)", padding: "10px 0" }}>
          {TIERS.map((tierName, idx) => {
            const isCurrent = idx === tierInfo.i && !state.calibrating;
            const threshold = [0, 900, 1200, 1500, 1800, 2100][idx];

            return (
              <div
                key={tierName}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  background: isCurrent ? "var(--cf)" : "transparent",
                  fontWeight: isCurrent ? 700 : 400,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    className="tbg"
                    style={{ "--tc": TIER_COLORS[idx] }}
                  >
                    {tierName}
                  </span>
                  {isCurrent && <span className="tag" style={{ fontSize: "10px" }}>Current</span>}
                </div>
                <span className="mu" style={{ fontSize: "12px" }}>{threshold}+ ELO</span>
              </div>
            );
          })}
        </div>

        <h3>Your Topic Calibration</h3>
        <p className="mu" style={{ fontSize: "12px", margin: "2px 0 8px" }}>
          Topic ratings move independently with diagnostic ELO calculation.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {topics.map((t) => {
            const r = getTopicRating(t);
            const spot = getSpotStatus(t);
            return (
              <div key={t} className="tr" style={{ padding: "6px 0" }}>
                <span>{t}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className={spot.color} style={{ fontSize: "12px", fontWeight: 600 }}>
                    {spot.label}
                  </span>
                  <b>{r}</b>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
