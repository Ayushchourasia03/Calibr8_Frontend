import { useEffect, useMemo, useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { getTierForRating } from "../../utils/tierUtils";
import { rankingsApi } from "./rankingsApi";
import { usersApi } from "../profile/usersApi";
import { tokenStorage } from "../../services/apiClient";

const AVG = [
  "linear-gradient(135deg,#5EA0FF,#B16BFF)",
  "linear-gradient(135deg,#36D1C4,#5EA0FF)",
  "linear-gradient(135deg,#FF8A3D,#FF4F7A)",
];

const SCOPES = [
  ["global", "Global"],
  ["country", "Country"],
  ["state", "State"],
  ["college", "College"],
  ["batch", "Batch"],
];

export function RankingsView() {
  const { state, setState } = useCalibr8();
  const profile = state.user || {};
  const scopeFilters = useMemo(
    () => ({
      country: profile.country || state.prof?.country || "",
      state: profile.state || state.prof?.state || "",
      college: profile.college || state.college || "",
      batch: profile.batch || state.prof?.year || "",
    }),
    [
      profile.country,
      profile.state,
      profile.college,
      profile.batch,
      state.prof?.country,
      state.prof?.state,
      state.prof?.year,
      state.college,
    ],
  );
  const availableScope = (scope) => scope === "global" || Boolean(scopeFilters[scope]);
  const initialScope = availableScope(state.board?.toLowerCase())
    ? state.board.toLowerCase()
    : "global";
  const [scope, setScope] = useState(initialScope);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!tokenStorage.get()) return undefined;
    let active = true;
    usersApi
      .getProfile()
      .then((response) => {
        if (!response?.success || !response.user) {
          throw new Error("The profile response was invalid.");
        }
        if (active) {
          setLoading(true);
          setState((current) => ({
            ...current,
            user: response.user,
            college: response.user.college || current.college,
            prof: {
              ...current.prof,
              country: response.user.country ?? current.prof?.country ?? "",
              state: response.user.state ?? current.prof?.state ?? "",
              college: response.user.college ?? current.prof?.college ?? "",
              year: response.user.batch ?? current.prof?.year ?? "",
            },
          }));
        }
      })
      .catch((err) => {
        if (active) {
          setProfileError(err.message || "Could not load your profile filters.");
        }
      });
    return () => {
      active = false;
    };
  }, [setState]);

  useEffect(() => {
    let active = true;
    const filters = scope === "global" ? {} : { [scope]: scopeFilters[scope] };
    rankingsApi
      .getRankings({ scope: scope === "global" ? undefined : scope, ...filters })
      .then((response) => {
        const users = response?.data;
        if (!Array.isArray(users)) {
          throw new Error("The rankings response was invalid.");
        }
        if (active) setRows(users);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load rankings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scope, scopeFilters, retry]);

  const userId = profile.id;
  const myIndex = rows.findIndex((row) => row.id === userId);
  const podiumOrder = [
    { rank: 2, data: rows[1], medal: "🥈", className: "p2" },
    { rank: 1, data: rows[0], medal: "👑", className: "p1" },
    { rank: 3, data: rows[2], medal: "🥉", className: "p3" },
  ];

  const handleScopeChange = (event) => {
    const value = event.target.value;
    setLoading(true);
    setError("");
    setScope(value);
    setState((current) => ({ ...current, board: value }));
  };

  const getAvatar = (row) => row.name?.trim()?.[0]?.toUpperCase() || "👤";
  const getRank = (row) => getTierForRating(Number(row.rating) || 0);

  return (
    <div>
      <h1>Rankings</h1>

      <div className="row">
        <label className="mu">
          Show{" "}
          <select
            id="scp"
            value={scope}
            onChange={handleScopeChange}
            aria-label="Ranking scope"
          >
            {SCOPES.map(([value, label]) => (
              <option
                key={value}
                value={value}
                disabled={!availableScope(value)}
              >
                {label}
              </option>
            ))}
          </select>
        </label>
        {scopeFilters.college && scope === "college" && (
          <span className="tag">{scopeFilters.college}</span>
        )}
      </div>

      {loading && <p className="mu">Loading rankings…</p>}
      {error && (
        <div className="card" role="alert">
          <p>{error}</p>
          <button
            className="btn ghost"
            onClick={() => {
              setLoading(true);
              setError("");
              setRetry((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      {profileError && <p className="mu">{profileError}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="mu">No users are listed for this ranking yet.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className="pod2">
            {podiumOrder.map((item, index) => {
              const row = item.data;
              if (!row) return null;
              const tier = getRank(row);
              const background = AVG[(row.name?.length + index || 0) % AVG.length];
              return (
                <div key={row.id} className={`pc ${item.className}`}>
                  <div className="medal">{item.medal}</div>
                  <span className="av" style={{ background }}>
                    {getAvatar(row)}
                  </span>
                  <h3>{row.name || "Learner"}</h3>
                  <span className="tbg" style={{ "--tc": tier.color }}>
                    {tier.full}
                  </span>
                  <p className="mu">
                    {Number(row.score || 0).toLocaleString()} points
                  </p>
                  <div className="stepb">{item.rank}</div>
                </div>
              );
            })}
          </div>

          {userId && (
            <div className="card" style={{ margin: "12px 0" }}>
              {myIndex >= 0 ? (
                <b>You are #{myIndex + 1} in this ranking.</b>
              ) : (
                <span className="mu">
                  Your account is not in this result set.
                </span>
              )}
            </div>
          )}

          <div className="card" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Learner</th>
                  <th>Tier</th>
                  <th>Rating</th>
                  <th>Score</th>
                  <th>Streak</th>
                  <th>Strict</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const tier = getRank(row);
                  const background = AVG[(row.name?.length + index || 0) % AVG.length];
                  const isMe = row.id === userId;
                  return (
                    <tr key={row.id} className={isMe ? "me" : ""}>
                      <td>{index + 1}</td>
                      <td>
                        <span
                          className="av sm"
                          style={{ background, marginRight: 8 }}
                        >
                          {getAvatar(row)}
                        </span>
                        {row.name || "Learner"}
                        {isMe ? " (you)" : ""}
                      </td>
                      <td>
                        <span className="tbg" style={{ "--tc": tier.color }}>
                          {tier.full}
                        </span>
                      </td>
                      <td>{Number(row.rating || 0).toLocaleString()}</td>
                      <td>{Number(row.score || 0).toLocaleString()}</td>
                      <td>🔥 {Number(row.streak || 0)}</td>
                      <td>
                        {row.strictPercent == null ? "-" : `${row.strictPercent}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mu" style={{ marginTop: 12 }}>
            Rankings and statistics are provided by the backend leaderboard.
          </p>
        </>
      )}
    </div>
  );
}
