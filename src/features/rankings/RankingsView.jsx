import { useState, useEffect } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { RANKING_CATEGORIES } from "../../data/rankingsData";
import { getTierForRating } from "../../utils/tierUtils";
import { api } from "../../services/api";

export function RankingsView() {
  const { state } = useCalibr8();
  const [activeBoard, setActiveBoard] = useState(state.board || "College");
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchRankings() {
      setLoading(true);
      setError(null);

      try {
        const scopeParam =
          activeBoard === "Global" || activeBoard === "All"
            ? undefined
            : activeBoard.toLowerCase();

        const params = {
          scope: scopeParam,
          limit: 50,
        };

        if (scopeParam === "college" && state.college) {
          params.college = state.college;
        } else if (scopeParam === "batch" && state.batch) {
          params.batch = state.batch;
        } else if (scopeParam === "state" && state.state) {
          params.state = state.state;
        } else if (scopeParam === "country" && state.country) {
          params.country = state.country;
        }

        const res = await api.rankings.getRankings(params);

        if (isMounted) {
          if (res?.data && Array.isArray(res.data)) {
            const currentUserId = state.user?.id;
            const currentUserName =
              state.name ||
              (state.user && !state.user.guest
                ? state.user.email?.split("@")[0]
                : null);

            const mapped = res.data.map((u, i) => {
              const isMe =
                (currentUserId && u.id === currentUserId) ||
                (currentUserName && u.name?.toLowerCase() === currentUserName.toLowerCase());

              return {
                id: u.id || `u-${i}`,
                name: u.name || `Learner #${i + 1}`,
                avatar: ["🙂", "😎", "🤓", "🧑‍💻", "👩‍💻", "🦊", "🐼", "🚀"][i % 8],
                rating: u.rating || 1200,
                score: u.score || 0,
                streak: u.streak || 1,
                strictPct: `${u.strictPercent || 90}%`,
                college: u.college || "",
                tier: u.tier || null,
                isMe,
              };
            });

            // If current user is logged in and not already in the list, insert their live position
            if (currentUserName && !mapped.some((r) => r.isMe)) {
              const myEntry = {
                id: currentUserId || "me",
                name: currentUserName,
                avatar: state.avatar || "🙂",
                rating: state.rating || 1200,
                score: state.score || 0,
                streak: state.streak || 1,
                strictPct: "95%",
                college: state.college || "",
                tier: null,
                isMe: true,
              };
              mapped.push(myEntry);
              mapped.sort((a, b) => b.score - a.score);
            }

            setRankings(mapped);
          } else {
            setRankings([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Could not fetch leaderboard from backend:", err.message);
          setError("Failed to load rankings from backend server.");
          setRankings([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRankings();

    return () => {
      isMounted = false;
    };
  }, [
    activeBoard,
    state.college,
    state.batch,
    state.state,
    state.country,
    state.user,
    state.name,
    state.rating,
    state.score,
    state.streak,
    state.avatar,
  ]);

  // Podium (Top 3)
  const pRank1 = rankings[0];
  const pRank2 = rankings[1];
  const pRank3 = rankings[2];

  const t1 = pRank1 ? getTierForRating(pRank1.rating) : null;
  const t2 = pRank2 ? getTierForRating(pRank2.rating) : null;
  const t3 = pRank3 ? getTierForRating(pRank3.rating) : null;

  return (
    <div>
      <div style={{ marginBottom: "12px" }}>
        <h1>Calibr8 Leaderboard</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          Live backend verified rankings. Rating shows raw skill calibration; score shows cumulative deliberate practice.
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

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p className="mu">Fetching live rankings from backend...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: "center", padding: "30px" }}>
          <p className="bad">{error}</p>
          <button
            className="btn ghost"
            style={{ marginTop: "10px" }}
            onClick={() => setActiveBoard((b) => b)}
          >
            Retry Connection
          </button>
        </div>
      ) : rankings.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <h3>No verified rankings found</h3>
          <p className="mu" style={{ margin: "8px 0 14px" }}>
            Be the first to rank on the {activeBoard} leaderboard by solving daily problems!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {pRank1 && (
            <div className="pod">
              {/* Rank 2 - Silver */}
              {pRank2 ? (
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
                  {pRank2.college && (
                    <div className="mu" style={{ fontSize: "11px", marginTop: "2px" }}>
                      {pRank2.college}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card" style={{ opacity: 0.5 }}>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>🥈</div>
                  <div className="mu">Rank #2 Open</div>
                </div>
              )}

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
                {pRank1.college && (
                  <div className="mu" style={{ fontSize: "11px", marginTop: "2px" }}>
                    {pRank1.college}
                  </div>
                )}
              </div>

              {/* Rank 3 - Bronze */}
              {pRank3 ? (
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
                  {pRank3.college && (
                    <div className="mu" style={{ fontSize: "11px", marginTop: "2px" }}>
                      {pRank3.college}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card" style={{ opacity: 0.5 }}>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>🥉</div>
                  <div className="mu">Rank #3 Open</div>
                </div>
              )}
            </div>
          )}

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
                {rankings.map((row, idx) => {
                  const tier = getTierForRating(row.rating);
                  const rankNum = idx + 1;
                  return (
                    <tr key={row.id || idx} className={row.isMe ? "me" : ""}>
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
                        {row.college && (
                          <span className="mu" style={{ marginLeft: "6px", fontSize: "11px" }}>
                            • {row.college}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="tbg" style={{ "--tc": tier.color }}>
                          {row.tier || tier.full}
                        </span>
                      </td>
                      <td>
                        <b>{row.rating}</b>
                      </td>
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
        </>
      )}
    </div>
  );
}