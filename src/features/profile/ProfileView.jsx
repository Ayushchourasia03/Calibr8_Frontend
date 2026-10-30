import { useState, useMemo, useEffect } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { ShieldBadge } from "../../utils/tierUtils";
import { DIFFICULTY_LABELS } from "../../data/constants";
import { usersApi } from "./usersApi";
import { tokenStorage } from "../../services/apiClient";
import { ConnectedAccounts } from "./ConnectedAccounts";

const AVATARS = [
  "🙂", "😎", "🤓", "🧑‍💻", "👩‍💻", "🧑‍🚀", "🦊", "🐼", "🚀", "🎮",
];

const ago = (t) => {
  const m = Math.round((Date.now() - t) / 6e4);
  return m < 1
    ? "just now"
    : m < 60
    ? `${m} min ago`
    : m < 1440
    ? `${Math.round(m / 60)} h ago`
    : `${Math.round(m / 1440)} d ago`;
};

export function ProfileView() {
  const {
    state,
    setState,
    tierInfo,
    setActiveModal,
    setModalData,
    getTopicRating,
    setAuthModalOpen,
  } = useCalibr8();

  const [act, setAct] = useState(state.act || "y");
  const [profileStatus, setProfileStatus] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(() =>
    Boolean(tokenStorage.get()),
  );

  useEffect(() => {
    if (!tokenStorage.get()) return undefined;
    let active = true;
    usersApi
      .getProfileOverview()
      .then((response) => {
        if (!response?.success || !response.user) {
          throw new Error("The profile response was invalid.");
        }
        if (!active) return;
        const user = response.user;
        setState((current) => ({
          ...current,
          user,
          name: user.name || current.name,
          college: user.college || current.college,
          activity: response.activity || {},
          prof: {
            ...current.prof,
            country: user.country ?? current.prof?.country ?? "",
            state: user.state ?? current.prof?.state ?? "",
            college: user.college ?? current.prof?.college ?? "",
            branch: user.branch ?? current.prof?.branch ?? "",
            year: user.batch ?? current.prof?.year ?? "",
          },
        }));
      })
      .catch((err) => {
        if (active) {
          setProfileStatus({
            type: "error",
            message: err.message || "Could not load your backend profile.",
          });
        }
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });
    return () => {
      active = false;
    };
  }, [setState, state.user?.id]);

  const myName =
    state.name ||
    (state.user && !state.user.guest
      ? state.user.email?.split("@")[0]
      : "You");

  const P = {
    country: state.user?.country ?? state.prof?.country ?? "",
    state: state.user?.state ?? state.prof?.state ?? "",
    college: state.user?.college ?? state.prof?.college ?? "",
    branch: state.user?.branch ?? state.prof?.branch ?? "",
    year: state.user?.batch ?? state.prof?.year ?? "",
  };

  const n = useMemo(() => new Date(), []);
  const A = useMemo(() => state.activity || {}, [state.activity]);
  const solvesCount = state.user
    ? Object.values(state.solved || {}).filter(Boolean).length
    : Object.keys(state.best || {}).length;
  const L = state.levels || {};

  // Build Heatmap
  const { heatCells, monthLabels } = useMemo(() => {
    let ml = [];
    const start = new Date(
      Date.UTC(
        n.getUTCFullYear(),
        n.getUTCMonth(),
        n.getUTCDate() - n.getUTCDay() - 52 * 7,
        12,
      ),
    );
    let last = -9,
      lm = -1;
    for (let w = 0; w < 53; w++) {
      const d0 = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate() + w * 7,
          12,
        )
      );
      if (d0.getUTCMonth() !== lm && w - last >= 3) {
        ml.push(
          <span key={w} style={{ gridColumn: w + 1 }}>
            {d0.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}
          </span>
        );
        last = w;
      }
      lm = d0.getUTCMonth();
    }

    const cells = [];
    for (let i = 0; i < 53 * 7; i++) {
      const d = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate() + i,
          12,
        )
      );
      if (
        d.getTime() >
        Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 12)
      ) {
        cells.push(<i key={`f_${i}`} style={{ visibility: "hidden" }} />);
        continue;
      }
      const k = d.toISOString().slice(0, 10);
      const c = A[k] || 0;
      const hClass = c >= 4 ? "h3" : c >= 2 ? "h2" : c >= 1 ? "h1" : "";
      cells.push(
        <i key={k} className={hClass} title={`${k}: ${c} submission(s)`} />
      );
    }

    return { heatCells: cells, monthLabels: ml };
  }, [n, A]);

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const list = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(
        Date.UTC(n.getUTCFullYear(), n.getUTCMonth() - i, 15, 12),
      );
      const p = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const count = Object.keys(A)
        .filter((k) => k.startsWith(p))
        .reduce((sum, k) => sum + A[k], 0);
      list.push([
        d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        count,
      ]);
    }
    return list;
  }, [n, A]);

  const maxMonth = Math.max(1, ...monthlyData.map((x) => x[1]));
  const totalSubs = Object.values(A).reduce((a, b) => a + b, 0);
  const activeDays = Object.keys(A).length;

  // Rating history chart
  const H = state.hist || [];
  const rs = H.map((h) => h.r);
  const lo = rs.length ? Math.min(...rs) - 40 : 0;
  const hi = rs.length ? Math.max(...rs) + 40 : 1;
  const W = 520;
  const Hh = 150;
  const points = H.map(
    (h, i) =>
      `${((i / (H.length - 1)) * W).toFixed(1)},${(
        Hh -
        ((h.r - lo) / (hi - lo)) * Hh
      ).toFixed(1)}`
  ).join(" ");

  // Badges
  const badges = [
    ["First solve", solvesCount >= 1, "🎯"],
    ["7-day streak", Math.max(state.longest || 0, state.streak || 0) >= 7, "🔥"],
    ["Word collector", (state.wordsLearned || 0) >= 10, "📖"],
    [
      "Strict solver",
      (state.recent || []).some((r) => r.mode === "strict" && r.tier > 0),
      "🛡️",
    ],
    ["Tier revealed", !state.calibrating, "⭐"],
    ["Note taker", Object.values(state.notes || {}).some(Boolean), "📝"],
  ];

  const handleProfileFieldsChange = (changes) => {
    const updated = { ...P, ...changes };

    setState((s) => ({
      ...s,
      prof: updated,
      college: updated.college,
    }));
  };

  const handleProfileFieldChange = (field, value) => {
    handleProfileFieldsChange({ [field]: value });
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setState((s) => ({ ...s, name }));
  };

  const handleAvatarSelect = (av) => {
    setState((s) => ({ ...s, avatar: av }));
  };

  const saveProfile = async () => {
    const name = state.name?.trim();
    if (!name) {
      setProfileStatus({ type: "error", message: "Enter a name before saving." });
      return;
    }
    if (!tokenStorage.get()) {
      setProfileStatus({
        type: "error",
        message: "Sign in to save your profile to the backend.",
      });
      setAuthModalOpen(true);
      return;
    }

    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const response = await usersApi.updateProfile({
        name,
        college: P.college,
        branch: P.branch,
        batch: String(P.year || ""),
        state: P.state,
        country: P.country,
      });
      if (!response?.success || !response.user) {
        throw new Error("The profile save response was invalid.");
      }
      setState((current) => ({
        ...current,
        user: response.user,
        prof: P,
        name: response.user.name || name,
        college: response.user.college || P.college,
      }));
      setProfileStatus({ type: "success", message: "Profile saved to your account." });
    } catch (err) {
      setProfileStatus({
        type: "error",
        message: err.message || "Could not save your profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleActToggle = (mode) => {
    setAct(mode);
    setState((s) => ({ ...s, act: mode }));
  };

  return (
    <div>
      <h1>Profile</h1>

      <div className="grid">
        {/* Profile Card */}
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <div className="phead">
            <span className="av big2">{state.avatar || "🙂"}</span>
            <div className="pinfo">
              <h2 style={{ margin: 0 }}>{myName}</h2>
              <p className="mu" style={{ margin: "2px 0" }}>
                {state.user
                  ? state.user.guest
                    ? "Guest on this device"
                    : state.user.email
                  : "Not signed in"}
                {state.college ? ` · ${state.college}` : ""}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <ShieldBadge
                tierIndex={tierInfo.i}
                divisionIndex={tierInfo.dv}
                size={84}
                calibrating={state.calibrating}
              />
              <div>
                <b>{state.calibrating ? "Calibrating" : tierInfo.full}</b>
              </div>
            </div>
          </div>

          <div className="row" style={{ marginTop: "10px" }}>
            {AVATARS.map((av) => (
              <button
                key={av}
                className={`pill avp ${
                  av === (state.avatar || "🙂") ? "on" : ""
                }`}
                onClick={() => handleAvatarSelect(av)}
              >
                {av}
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: "18px" }}>About you</h3>
          <div className="pf">
            <label>
              Name
              <input
                id="pn"
                value={myName === "You" ? "" : myName}
                placeholder="Your name"
                onChange={handleNameChange}
              />
            </label>

            <label>
              College
              <input
                id="pcl"
                value={P.college}
                placeholder="Enter your college"
                onChange={(e) =>
                  handleProfileFieldChange("college", e.target.value)
                }
              />
            </label>

            <label>
              Branch
              <input
                id="pbr"
                value={P.branch}
                placeholder="Enter your branch"
                onChange={(e) =>
                  handleProfileFieldChange("branch", e.target.value)
                }
              />
            </label>

            <label>
              Graduation year
              <input
                id="pyr"
                type="text"
                inputMode="numeric"
                value={P.year}
                placeholder="Enter graduation year"
                onChange={(e) => handleProfileFieldChange("year", e.target.value)}
              />
            </label>

            <label>
              State
              <input
                id="pst"
                value={P.state}
                placeholder="Enter your state"
                onChange={(e) => handleProfileFieldChange("state", e.target.value)}
              />
            </label>

            <label>
              Country
              <input
                id="pco"
                value={P.country}
                placeholder="Enter your country"
                onChange={(e) =>
                  handleProfileFieldChange("country", e.target.value)
                }
              />
            </label>
          </div>
          <p className="mu">
            Avatar is stored on this device. Name and the profile fields supported
            by your account are saved to the backend.
          </p>
          {loadingProfile && <p className="mu">Loading account profile…</p>}
          {profileStatus && (
            <p
              role={profileStatus.type === "error" ? "alert" : "status"}
              className={profileStatus.type === "error" ? "mu" : "ok"}
              style={
                profileStatus.type === "error"
                  ? { color: "#FF8A9B" }
                  : undefined
              }
            >
              {profileStatus.message}
            </p>
          )}
          <button className="btn" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </div>

        {/* Stats Card */}
        <div className="card">
          <h2>Stats</h2>
          <div className="tr">
            <span>Questions solved</span>
            <b>{solvesCount}</b>
          </div>

          <div className="tr">
            <span>Score</span>
            <b>
              {Number(
                state.user ? state.user.score : Math.floor((state.score || 0) / 10),
              ).toLocaleString()}
            </b>
          </div>
          <div className="tr">
            <span>Coins</span>
            <b>{state.coins || 0}</b>
          </div>
          <div className="tr">
            <span>Streak (best {Math.max(state.longest || 0, state.streak || 0)})</span>
            <b>{state.streak || 0}</b>
          </div>
          <div className="tr">
            <span>Words learned</span>
            <b>{state.wordsLearned || 0}</b>
          </div>
        </div>

        <ConnectedAccounts onRequireAuth={() => setAuthModalOpen(true)} />

        {/* Tier Graph Card */}
        <div className="card">
          <h2>Tier graph</h2>
          {H.length >= 2 ? (
            <div>
              <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: "100%", height: "150px" }}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={tierInfo.color || "#2F7BFF"}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mu">
                Rating {rs[0]} to {rs[rs.length - 1]} over {H.length} solves.
              </p>
            </div>
          ) : (
            <p className="mu">Solve a few questions and your tier graph will draw here.</p>
          )}
        </div>

        {/* Activity Card */}
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <div
            className="row"
            style={{ justifyContent: "space-between", margin: 0 }}
          >
            <h2 style={{ margin: 0 }}>Activity</h2>
            <span>
              <button
                className={`pill ${act === "y" ? "on" : ""}`}
                onClick={() => handleActToggle("y")}
              >
                Annual
              </button>{" "}
              <button
                className={`pill ${act === "m" ? "on" : ""}`}
                onClick={() => handleActToggle("m")}
              >
                Monthly
              </button>
            </span>
          </div>
          <p className="mu">
            {totalSubs} fully accepted submission(s) in the last year, {activeDays} active day(s), best streak{" "}
            {Math.max(state.longest || 0, state.streak || 0)}.
          </p>
          {act === "y" ? (
            <div className="hmw">
              <div className="ml">{monthLabels}</div>
              <div className="heat">{heatCells}</div>
            </div>
          ) : (
            <div className="mbar">
              {monthlyData.map(([label, count]) => (
                <div key={label}>
                  <i style={{ height: `${Math.max(3, (count / maxMonth) * 90)}px` }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions Card */}
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <h2>Recent submissions</h2>
          {(state.recent || []).length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="rvt">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Topic</th>
                    <th>Mode</th>
                    <th>Result</th>
                    <th>Points</th>
                    <th>Notes</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {(state.recent || []).map((r, idx) => {
                    const nt = (state.notes || {})[r.k] || "";
                    return (
                      <tr key={idx}>
                        <td>
                          <b>{r.t}</b>
                        </td>
                        <td>
                          <span className="tag">{r.tp || "-"}</span>
                        </td>
                        <td>
                          <span
                            className="tag"
                            style={{
                              color: r.mode === "strict" ? "#FF8A9B" : "#7EE7DB",
                            }}
                          >
                            {r.mode === "strict" ? "Strict" : "Relaxed"}
                          </span>
                        </td>
                        <td>{r.tier ? `Tier ${r.tier}` : "Not solved"}</td>
                        <td>+{r.pts}</td>
                        <td className="mu" title={nt}>
                          {nt ? (nt.length > 36 ? `${nt.slice(0, 36)}...` : nt) : "-"}
                        </td>
                        <td className="mu">{ago(r.at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mu">No submissions yet.</p>
          )}
        </div>

        {/* Badges Card */}
        <div className="card">
          <h2>Badges</h2>
          <div className="row">
            {badges.map(([title, unlocked, icon]) => (
              <span
                key={title}
                className="tag"
                style={{ opacity: unlocked ? 1 : 0.4 }}
                title={title}
              >
                {icon} {title}
              </span>
            ))}
          </div>
        </div>

        {/* LinkedIn Shareable Card */}
        <div className="card">
          <h2>LinkedIn card</h2>
          <div className="share">
            <div className="mu" style={{ color: "#7EE7DB" }}>
              CALIBR8
            </div>
            <h2 style={{ color: "#fff" }}>{myName}</h2>
            <div>
              {state.calibrating ? "Calibrating" : tierInfo.full} · Rating{" "}
              {tierInfo.R || state.rating}
            </div>
            <div>
              Solved {solvesCount} · Streak {state.streak || 0} days
            </div>
            <div className="mu" style={{ color: "#9FB" }}>
              Strict-mode verified
            </div>
          </div>
        </div>

        {/* Instagram Clip */}
        <div className="card">
          <h2>Instagram clip</h2>
          <div className="clip">
            {state.calibrating
              ? "CALIBRATING"
              : `RANK ${tierInfo.full?.toUpperCase()}`}
            <br />
            <small>{state.streak || 0}-day streak</small>
          </div>
        </div>

        {/* Level details collapsible */}
        <div className="card">
          <details>
            <summary>
              <b>Level details</b>
            </summary>
            {Object.keys(L).map((t) => {
              const r = getTopicRating(t);
              const base = [800, 1200, 1600][L[t] || 0];
              const diff = r - base;
              const spClass = diff >= 50 ? "g" : diff <= -50 ? "w" : "b";
              return (
                <div key={t} className="tr">
                  <span>
                    <i className={`sp ${spClass}`} />
                    {t}
                  </span>
                  <b>{DIFFICULTY_LABELS[L[t] || 0]}</b>
                </div>
              );
            })}
            <div className="row" style={{ marginTop: "12px" }}>
              <button
                className="btn"
                id="lvp2"
                onClick={() => {
                  setActiveModal("onboarding");
                  setModalData({ step: 1 });
                }}
              >
                Edit setup
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}