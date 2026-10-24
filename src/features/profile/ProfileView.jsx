import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { ymd } from "../../utils/tierUtils";

const AVATARS = [
  "🙂", "😎", "🤓", "🧑‍💻", "👩‍💻", "🧑‍🚀", "🦊", "🐼", "🚀", "🎮",
];

export function ProfileView() {
  const { state, setState, tierInfo, showToast } = useCalibr8();
  const [activityMode, setActivityMode] = useState("y"); // 'y' = year (heat), 'm' = monthly (mbar)

  const myName =
    state.name ||
    (state.user && !state.user.guest
      ? state.user.email?.split("@")[0]
      : "Learner");

  // 53-week heatmap
  const n = new Date();
  const A = state.activity || {};
  const heatmapBoxes = [];
  const start = new Date(
    n.getFullYear(),
    n.getMonth(),
    n.getDate() - n.getDay() - 52 * 7,
  );

  for (let i = 0; i < 53 * 7; i++) {
    const d = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + i,
    );
    if (d > n) {
      heatmapBoxes.push({ visible: false, key: `f_${i}` });
      continue;
    }
    const k = ymd(d.getFullYear(), d.getMonth(), d.getDate());
    const count = A[k] || 0;
    heatmapBoxes.push({
      visible: true,
      key: k,
      count,
    });
  }

  // Monthly breakdown
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = Object.keys(A)
      .filter((k) => k.startsWith(prefix))
      .reduce((sum, k) => sum + A[k], 0);
    monthlyData.push([d.toLocaleString("en-US", { month: "short" }), count]);
  }
  const maxMonthly = Math.max(1, ...monthlyData.map((x) => x[1]));
  const totalSubmissions = Object.values(A).reduce((a, b) => a + b, 0);

  // Rating history chart
  const H = state.hist || [
    { r: 1200 },
    { r: 1350 },
    { r: 1480 },
    { r: state.rating || 1630 },
  ];
  const rs = H.map((h) => h.r);
  const lo = Math.min(...rs) - 40;
  const hi = Math.max(...rs) + 40;
  const W = 520;
  const Hh = 130;
  const points = H.map(
    (h, i) =>
      `${((i / (H.length - 1)) * W).toFixed(1)},${(Hh - ((h.r - lo) / (hi - lo)) * Hh).toFixed(1)}`,
  ).join(" ");

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(
      `Calibr8 Verified Skill Rank: ${tierInfo.full} (${state.rating || 1630} ELO)\nStreak: ${state.streak || 46} days\nCalibrating deliberate engineering daily at Calibr8.`,
    );
    showToast("Share text copied to clipboard!");
  };

  const handleCopyStory = () => {
    navigator.clipboard?.writeText(
      `#Calibr8 Rank: ${tierInfo.full} • Rating: ${state.rating || 1630} • Streak: ${state.streak || 46}d 🔥`,
    );
    showToast("Story text copied to clipboard!");
  };

  const tierInitials = tierInfo.full
    .split(" ")
    .map((x) => x[0])
    .join("");

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1>Learner Profile</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          Verified calibration, activity heatmaps, and shareable rank cards.
        </p>
      </div>

      {/* Identity Card */}
      <div className="card" style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <div className="av big2">{state.avatar || "🙂"}</div>

        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
            <input
              type="text"
              value={state.name || ""}
              placeholder="Your full name"
              onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              style={{ fontSize: "16px", fontWeight: "bold", padding: "6px 10px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
            <input
              type="text"
              value={state.college || ""}
              placeholder="College / Organization name"
              onChange={(e) => setState((s) => ({ ...s, college: e.target.value }))}
              style={{ fontSize: "13px", padding: "5px 10px", width: "100%", maxWidth: "300px" }}
            />
          </div>

          {/* Avatar selector */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {AVATARS.map((av) => (
              <button
                key={av}
                onClick={() => setState((s) => ({ ...s, avatar: av }))}
                style={{
                  background: state.avatar === av ? "var(--ac)" : "var(--cf)",
                  border: "1px solid var(--ln)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            className="badge"
            style={{ "--tc": tierInfo.color, margin: "0 auto 6px" }}
          >
            {tierInitials}
          </div>
          <span className="tbg" style={{ "--tc": tierInfo.color }}>
            {tierInfo.full}
          </span>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "16px" }}>
        <div className="card">
          <div className="mu">Verified Rating</div>
          <div className="big">{state.rating || 1630}</div>
          <div className="mu" style={{ fontSize: "12px" }}>
            {state.calibrating ? "Calibrating..." : tierInfo.full}
          </div>
        </div>

        <div className="card">
          <div className="mu">Daily Streak</div>
          <div className="big">{state.streak || 46}d</div>
          <div className="mu" style={{ fontSize: "12px" }}>
            Active flame status 🔥
          </div>
        </div>

        <div className="card">
          <div className="mu">Total Solves</div>
          <div className="big">{state.solves || 6}</div>
          <div className="mu" style={{ fontSize: "12px" }}>
            Questions completed
          </div>
        </div>

        <div className="card">
          <div className="mu">Strict Mode Verified</div>
          <div className="big">95%</div>
          <div className="mu" style={{ fontSize: "12px" }}>
            Fullscreen timed attempts
          </div>
        </div>
      </div>

      {/* Activity Heatmap Card */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3>Activity History</h3>
            <span className="mu">
              <b>{totalSubmissions}</b> total submissions recorded
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`pill ${activityMode === "y" ? "on" : ""}`}
              onClick={() => setActivityMode("y")}
            >
              53 Weeks
            </button>
            <button
              className={`pill ${activityMode === "m" ? "on" : ""}`}
              onClick={() => setActivityMode("m")}
            >
              12 Months
            </button>
          </div>
        </div>

        {activityMode === "y" ? (
          <div>
            <div className="heat">
              {heatmapBoxes.map((box) => {
                if (!box.visible) {
                  return <i key={box.key} style={{ opacity: 0 }} />;
                }
                const level =
                  box.count >= 3
                    ? "h3"
                    : box.count === 2
                      ? "h2"
                      : box.count === 1
                        ? "h1"
                        : "";
                return (
                  <i
                    key={box.key}
                    className={level}
                    title={`${box.key}: ${box.count} submissions`}
                  />
                );
              })}
            </div>
            <div className="row" style={{ justifyContent: "flex-end", fontSize: "11px", gap: "4px", marginTop: "8px" }}>
              <span className="mu">Less</span>
              <i style={{ width: "11px", height: "11px", borderRadius: "2px", background: "var(--cf)" }} />
              <i style={{ width: "11px", height: "11px", borderRadius: "2px", background: "rgba(47, 123, 255, 0.35)" }} />
              <i style={{ width: "11px", height: "11px", borderRadius: "2px", background: "rgba(47, 123, 255, 0.65)" }} />
              <i style={{ width: "11px", height: "11px", borderRadius: "2px", background: "#2F7BFF" }} />
              <span className="mu">More</span>
            </div>
          </div>
        ) : (
          <div className="mbar">
            {monthlyData.map(([mo, cnt]) => {
              const hPct = Math.max(8, Math.round((cnt / maxMonthly) * 100));
              return (
                <div key={mo}>
                  <i style={{ height: `${hPct}%` }} title={`${mo}: ${cnt}`} />
                  <span>{mo}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Trajectory Chart */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Rating Calibration Trajectory</h3>
        <p className="mu" style={{ margin: "2px 0 10px", fontSize: "12px" }}>
          Elo rating adjustments from verified question solves.
        </p>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${W} ${Hh}`}
            style={{ width: "100%", maxHeight: "150px", display: "block" }}
          >
            <defs>
              <linearGradient id="gLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2F7BFF" />
                <stop offset="50%" stopColor="#6B6BFF" />
                <stop offset="100%" stopColor="#B16BFF" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="url(#gLine)"
              strokeWidth="3"
              points={points}
            />
            {H.map((h, i) => {
              const cx = (i / (H.length - 1)) * W;
              const cy = Hh - ((h.r - lo) / (hi - lo)) * Hh;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill="#fff"
                  stroke="#2F7BFF"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Share Cards Row */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "stretch" }}>
        {/* LinkedIn share card */}
        <div className="share" style={{ flex: 1, minWidth: "280px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ font: "700 18px 'Space Grotesk', serif" }}>
              Calibr<b>8</b> Verified Rank
            </div>
            <span style={{ fontSize: "12px", opacity: 0.8 }}>LinkedIn Share</span>
          </div>

          <div style={{ margin: "14px 0" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{myName}</div>
            <div style={{ opacity: 0.8, fontSize: "13px" }}>
              {state.college || "Software Engineering"}
            </div>
            <div style={{ marginTop: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
              <div
                className="badge"
                style={{ "--tc": tierInfo.color, width: "60px", height: "60px", fontSize: "20px" }}
              >
                {tierInitials}
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>{tierInfo.full}</div>
                <div style={{ fontSize: "13px", opacity: 0.8 }}>
                  Rating: {state.rating || 1630} • Streak: {state.streak || 46}d
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn ghost"
            style={{ width: "100%", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
            onClick={handleCopyShare}
          >
            Copy LinkedIn Share Post 📋
          </button>
        </div>

        {/* Instagram vertical clip */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div className="clip">
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
              Calibr8
            </div>
            <div style={{ fontSize: "36px", marginBottom: "4px" }}>{state.avatar || "🙂"}</div>
            <div style={{ fontSize: "15px", marginBottom: "2px" }}>{myName}</div>
            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>
              {tierInfo.full}
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800" }}>{state.rating || 1630}</div>
            <div style={{ fontSize: "10px", opacity: 0.8 }}>ELO Rating</div>
            <div style={{ marginTop: "8px", fontSize: "11px" }}>🔥 {state.streak || 46} Days</div>
          </div>
          <button
            className="btn ghost"
            style={{ fontSize: "11px", padding: "4px 10px" }}
            onClick={handleCopyStory}
          >
            Copy Story Text
          </button>
        </div>
      </div>
    </div>
  );
}