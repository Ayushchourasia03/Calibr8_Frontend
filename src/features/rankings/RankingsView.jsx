import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { PEER_RANKINGS, RANKING_CATEGORIES } from "../../data/rankingsData";
import { getTierForRating } from "../../utils/tierUtils";

export function RankingsView() {
  const { state } = useCalibr8();
  const [activeBoard, setActiveBoard] = useState(state.board || "College");

  const myName =
    state.name ||
    (state.user && !state.user.guest
      ? state.user.email?.split("@")[0]
      : "You");

  const me = {
    name: myName,
    avatar: state.avatar || "🙂",
    rating: state.rating || 1630,
    score: state.score || 890,
    streak: state.streak || 46,
    strictPct: "95%",
    isMe: true,
  };

  const rows = PEER_RANKINGS.map((p) => ({
    name: p[0],
    avatar: p[1],
    rating: p[2],
    score: p[3],
    streak: p[4],
    strictPct: `${p[5]}%`,
    isMe: false,
  }))
    .concat([me])
    .sort((a, b) => b.score - a.score);

  // Top 3 Podium
  const pRank1 = rows[0];
  const pRank2 = rows[1] || rows[0];
  const pRank3 = rows[2] || rows[0];

  const t1 = getTierForRating(pRank1.rating);
  const t2 = getTierForRating(pRank2.rating);
  const t3 = getTierForRating(pRank3.rating);

  return (
    <div>
      <div style={{ marginBottom: "12px" }}>
        <h1>Calibr8 Leaderboard</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          Strict-mode verified rankings. Rating shows raw skill calibration; score shows cumulative deliberate practice.
        </p>
      </div>

      <div className="row">
        {RANKING_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveBoard(category)}
            className={`pill ${activeBoard === category ? "on" : ""}`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <div className="pod">
        {/* Rank 2 - Silver */}
        <div className="card">
          <div style={{ fontSize: "24px", marginBottom: "4px" }}>🥈</div>
          <div className="av" style={{ margin: "0 auto 8px" }}>
            {pRank2.avatar}
          </div>
          <h3 style={{ margin: "4px 0" }}>
            {pRank2.name} {pRank2.isMe && "(You)"}
          </h3>
          <span className="tbg" style={{ "--tc": t2.color, marginBottom: "4px" }}>
            {t2.full}
          </span>
          <div className="mu" style={{ fontSize: "12px", marginTop: "4px" }}>
            <b>{pRank2.score}</b> pts • {pRank2.rating} ELO
          </div>
        </div>

        {/* Rank 1 - Gold (Elevated) */}
        <div className="card" style={{ paddingBottom: "24px" }}>
          <div style={{ fontSize: "32px", marginBottom: "4px" }}>🥇</div>
          <div className="av" style={{ margin: "0 auto 8px" }}>
            {pRank1.avatar}
          </div>
          <h3 style={{ margin: "4px 0" }}>
            {pRank1.name} {pRank1.isMe && "(You)"}
          </h3>
          <span className="tbg" style={{ "--tc": t1.color, marginBottom: "4px" }}>
            {t1.full}
          </span>
          <div className="mu" style={{ fontSize: "13px", marginTop: "4px" }}>
            <b>{pRank1.score}</b> pts • {pRank1.rating} ELO
          </div>
        </div>

        {/* Rank 3 - Bronze */}
        <div className="card">
          <div style={{ fontSize: "24px", marginBottom: "4px" }}>🥉</div>
          <div className="av" style={{ margin: "0 auto 8px" }}>
            {pRank3.avatar}
          </div>
          <h3 style={{ margin: "4px 0" }}>
            {pRank3.name} {pRank3.isMe && "(You)"}
          </h3>
          <span className="tbg" style={{ "--tc": t3.color, marginBottom: "4px" }}>
            {t3.full}
          </span>
          <div className="mu" style={{ fontSize: "12px", marginTop: "4px" }}>
            <b>{pRank3.score}</b> pts • {pRank3.rating} ELO
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: "50px" }}>Rank</th>
              <th>Learner</th>
              <th>Tier</th>
              <th>Rating</th>
              <th>Streak</th>
              <th>Strict</th>
              <th style={{ textAlign: "right" }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const tier = getTierForRating(row.rating);
              const rankNum = idx + 1;
              return (
                <tr key={idx} className={row.isMe ? "me" : ""}>
                  <td className="mu">#{rankNum}</td>
                  <td>
                    <span className="av sm" style={{ marginRight: "8px" }}>
                      {row.avatar}
                    </span>
                    <b>{row.name}</b>
                    {row.isMe && (
                      <span className="tag" style={{ marginLeft: "8px", fontSize: "10px" }}>
                        You
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="tbg" style={{ "--tc": tier.color }}>
                      {tier.full}
                    </span>
                  </td>
                  <td><b>{row.rating}</b></td>
                  <td className="mu">🔥 {row.streak}d</td>
                  <td className="mu">{row.strictPct}</td>
                  <td style={{ textAlign: "right" }}>
                    <b>{row.score}</b>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}