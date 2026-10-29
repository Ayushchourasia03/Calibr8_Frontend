import { useState, useMemo } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { ymd, ShieldBadge } from "../../utils/tierUtils";
import { DIFFICULTY_LABELS } from "../../data/constants";

const AVATARS = [
  "🙂", "😎", "🤓", "🧑‍💻", "👩‍💻", "🧑‍🚀", "🦊", "🐼", "🚀", "🎮",
];

const DEGREES = ["B.Tech", "B.E.", "BCA", "B.Sc", "M.Tech", "MCA", "Other"];
const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics and Communication",
  "Electrical",
  "Mechanical",
  "Civil",
  "AI and ML",
  "Data Science",
  "Other",
];
const YEARS = [2026, 2027, 2028, 2029, 2030, 2031];

const COLLEGES = {
  "Uttar Pradesh": [
    "IIT Kanpur",
    "IIT (BHU) Varanasi",
    "IIIT Allahabad",
    "MNNIT Allahabad",
    "KIET Group of Institutions, Ghaziabad",
    "AKGEC Ghaziabad",
    "ABES Engineering College, Ghaziabad",
    "Amity University, Noida",
    "Galgotias University",
    "Jaypee Institute of Information Technology, Noida",
    "Bennett University",
  ],
  Delhi: [
    "IIT Delhi",
    "IIIT Delhi",
    "Delhi Technological University",
    "NSUT Delhi",
    "Jamia Millia Islamia",
    "Maharaja Agrasen Institute of Technology",
    "Bharati Vidyapeeth College of Engineering",
  ],
  Haryana: [
    "NIT Kurukshetra",
    "IIIT Sonepat",
    "Amity University Gurugram",
    "Maharshi Dayanand University",
    "Manav Rachna University",
  ],
  Maharashtra: [
    "IIT Bombay",
    "VJTI Mumbai",
    "COEP Pune",
    "VIT Pune",
    "Pune Institute of Computer Technology",
    "VNIT Nagpur",
  ],
  Karnataka: [
    "IIT Dharwad",
    "NITK Surathkal",
    "RV College of Engineering",
    "PES University",
    "BMS College of Engineering",
    "IISc Bangalore",
  ],
  "Tamil Nadu": [
    "IIT Madras",
    "NIT Tiruchirappalli",
    "Anna University",
    "SRM Institute of Science and Technology",
    "VIT Vellore",
    "PSG College of Technology",
  ],
  Telangana: [
    "IIT Hyderabad",
    "IIIT Hyderabad",
    "NIT Warangal",
    "JNTU Hyderabad",
    "CBIT Hyderabad",
  ],
  "West Bengal": [
    "IIT Kharagpur",
    "Jadavpur University",
    "NIT Durgapur",
    "IIEST Shibpur",
  ],
  Rajasthan: ["IIT Jodhpur", "MNIT Jaipur", "BITS Pilani", "LNMIIT Jaipur"],
  Gujarat: [
    "IIT Gandhinagar",
    "DA-IICT Gandhinagar",
    "NIT Surat",
    "Nirma University",
  ],
  "Madhya Pradesh": [
    "IIT Indore",
    "IIIT Gwalior",
    "MANIT Bhopal",
    "SGSITS Indore",
  ],
  Punjab: [
    "IIT Ropar",
    "Thapar Institute of Engineering and Technology",
    "Chitkara University",
  ],
  "Other state or union territory": [],
};

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
  } = useCalibr8();

  const [act, setAct] = useState(state.act || "y");

  const myName =
    state.name ||
    (state.user && !state.user.guest
      ? state.user.email?.split("@")[0]
      : "You");

  const P = Object.assign(
    {
      country: "India",
      state: "Uttar Pradesh",
      college: "AKGEC Ghaziabad",
      other: "",
      degree: "B.Tech",
      branch: "Computer Science",
      year: "2026",
    },
    state.prof || {}
  );

  const n = useMemo(() => new Date(), []);
  const A = useMemo(() => state.activity || {}, [state.activity]);
  const solvesCount = Object.keys(state.best || {}).length;
  const L = state.levels || {};

  // Build Heatmap
  const { heatCells, monthLabels } = useMemo(() => {
    let ml = [];
    const start = new Date(
      n.getFullYear(),
      n.getMonth(),
      n.getDate() - n.getDay() - 52 * 7
    );
    let last = -9,
      lm = -1;
    for (let w = 0; w < 53; w++) {
      const d0 = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + w * 7
      );
      if (d0.getMonth() !== lm && w - last >= 3) {
        ml.push(
          <span key={w} style={{ gridColumn: w + 1 }}>
            {d0.toLocaleString("en-US", { month: "short" })}
          </span>
        );
        last = w;
      }
      lm = d0.getMonth();
    }

    const cells = [];
    for (let i = 0; i < 53 * 7; i++) {
      const d = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + i
      );
      if (d > n) {
        cells.push(<i key={`f_${i}`} style={{ visibility: "hidden" }} />);
        continue;
      }
      const k = ymd(d.getFullYear(), d.getMonth(), d.getDate());
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
      const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
      const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const count = Object.keys(A)
        .filter((k) => k.startsWith(p))
        .reduce((sum, k) => sum + A[k], 0);
      list.push([d.toLocaleString("en-US", { month: "short" }), count]);
    }
    return list;
  }, [n, A]);

  const maxMonth = Math.max(1, ...monthlyData.map((x) => x[1]));
  const totalSubs = Object.values(A).reduce((a, b) => a + b, 0);
  const activeDays = Object.keys(A).length;

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

  const handleProfileFieldChange = (field, value) => {
    const updated = { ...P, [field]: value };
    const resolvedCollege =
      updated.college === "Other (type below)" || updated.country === "Other"
        ? updated.other
        : updated.college;

    setState((s) => ({
      ...s,
      prof: updated,
      college: resolvedCollege,
    }));
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setState((s) => ({ ...s, name }));
  };

  const handleAvatarSelect = (av) => {
    setState((s) => ({ ...s, avatar: av }));
  };

  const handleActToggle = (mode) => {
    setAct(mode);
    setState((s) => ({ ...s, act: mode }));
  };

  const stateColleges = COLLEGES[P.state] || [];
  const showCustomCollege =
    P.college === "Other (type below)" || P.country === "Other";

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
              Country
              <select
                id="pco"
                value={P.country}
                onChange={(e) => handleProfileFieldChange("country", e.target.value)}
              >
                <option value="India">India</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              State
              <select
                id="pst"
                value={P.state}
                onChange={(e) => {
                  handleProfileFieldChange("state", e.target.value);
                  handleProfileFieldChange("college", "");
                }}
              >
                <option value="">Select state</option>
                {Object.keys(COLLEGES).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            <label>
              College
              <select
                id="pcl"
                value={P.college}
                onChange={(e) => handleProfileFieldChange("college", e.target.value)}
              >
                <option value="">Select college</option>
                {stateColleges.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
                <option value="Other (type below)">Other (type below)</option>
              </select>
            </label>

            {showCustomCollege && (
              <label id="pcnw">
                College name
                <input
                  id="pcn"
                  value={P.other}
                  placeholder="Type your college"
                  onChange={(e) => handleProfileFieldChange("other", e.target.value)}
                />
              </label>
            )}

            <label>
              Degree
              <select
                id="pdg"
                value={P.degree}
                onChange={(e) => handleProfileFieldChange("degree", e.target.value)}
              >
                {DEGREES.map((deg) => (
                  <option key={deg} value={deg}>
                    {deg}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Branch
              <select
                id="pbr"
                value={P.branch}
                onChange={(e) => handleProfileFieldChange("branch", e.target.value)}
              >
                <option value="">Select branch</option>
                {BRANCHES.map((br) => (
                  <option key={br} value={br}>
                    {br}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Graduation year
              <select
                id="pyr"
                value={P.year}
                onChange={(e) => handleProfileFieldChange("year", e.target.value)}
              >
                <option value="">Select year</option>
                {YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
            <b>{Math.floor((state.score || 0) / 10).toLocaleString()}</b>
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
            {totalSubs} submission(s) in the last year, {activeDays} active day(s), best streak{" "}
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