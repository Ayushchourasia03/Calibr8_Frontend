import { useState, useMemo } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { getTierForRating } from "../../utils/tierUtils";

const PPL = [
  ["Riya Verma", "👩‍💻", 1790, 48210, 132, 88],
  ["Kabir Singh", "🧑‍🚀", 1690, 46950, 97, 74],
  ["Ananya Gupta", "👩‍🎓", 1610, 44120, 61, 91],
  ["Mohit Yadav", "🧔", 1540, 41300, 88, 52],
  ["Sneha Rao", "👩‍🔬", 1470, 39870, 40, 67],
  ["Dev Malhotra", "🧑‍🎤", 1390, 37010, 73, 80],
  ["Isha Kapoor", "👩‍🚀", 1310, 33400, 29, 58],
  ["Arjun Nair", "🧑‍💻", 1230, 30120, 51, 49],
  ["Meera Joshi", "👩‍🏫", 1150, 26800, 18, 36],
  ["Rahul Das", "🧑‍🔧", 1070, 22350, 36, 41],
];

const AVG = [
  "linear-gradient(135deg,#5EA0FF,#B16BFF)",
  "linear-gradient(135deg,#36D1C4,#5EA0FF)",
  "linear-gradient(135deg,#FF8A3D,#FF4F7A)",
];

const SCOPES = [
  "Global",
  "India",
  "State",
  "College",
  "Branch",
  "Batch",
  "Friends",
];

export function RankingsView() {
  const { state, setState } = useCalibr8();
  const [scope, setScope] = useState(state.board || "College");

  const myName =
    state.name ||
    (state.user && !state.user.guest
      ? state.user.email?.split("@")[0]
      : "You");

  const myAvatar = state.avatar || "🙂";
  const myRating = state.rating || 1630;
  const myScore = state.score || 16300;
  const myStreak = state.streak || 46;

  const rows = useMemo(() => {
    const list = PPL.map(([n, f, r, s, st, sp]) => ({
      name: n,
      avatar: f,
      rating: r,
      score: s,
      streak: st,
      strictPct: `${sp}%`,
      isMe: false,
    }));

    const me = {
      name: myName,
      avatar: myAvatar,
      rating: myRating,
      score: myScore,
      streak: myStreak,
      strictPct: "-",
      isMe: true,
    };

    list.push(me);
    list.sort((a, b) => b.score - a.score);
    return list;
  }, [myName, myAvatar, myRating, myScore, myStreak]);

  const myIndex = rows.findIndex((r) => r.isMe);

  // Podium order: [rows[1], rows[0], rows[2]] => #2, #1, #3
  const podiumOrder = [
    { rank: 2, data: rows[1], medal: "🥈", className: "p2" },
    { rank: 1, data: rows[0], medal: "👑", className: "p1" },
    { rank: 3, data: rows[2], medal: "🥉", className: "p3" },
  ];

  const handleScopeChange = (e) => {
    const val = e.target.value;
    setScope(val);
    setState((s) => ({ ...s, board: val }));
  };

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
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {state.college && scope === "College" && (
          <span className="tag">{state.college}</span>
        )}
      </div>

      {/* Podium 3-pillar layout */}
      <div className="pod2">
        {podiumOrder.map((item, idx) => {
          const r = item.data;
          if (!r) return null;
          const tier = getTierForRating(r.rating);
          const bgGrad = AVG[(r.name.length + idx) % 3];

          return (
            <div key={item.rank} className={`pc ${item.className}`}>
              <div className="medal">{item.medal}</div>
              <span className="av" style={{ background: bgGrad }}>
                {r.avatar}
              </span>
              <h3>
                {r.name}
                {r.isMe ? " (you)" : ""}
              </h3>
              <span className="tbg" style={{ "--tc": tier.color }}>
                {tier.full}
              </span>
              <p className="mu">{Math.floor(r.score).toLocaleString()} points</p>
              <div className="stepb">{item.rank}</div>
            </div>
          );
        })}
      </div>

      {/* User relative ranking banner */}
      <div className="card" style={{ margin: "12px 0" }}>
        <b>You are #{myIndex + 1}.</b>{" "}
        <span className="mu">
          {myIndex > 0
            ? `${Math.max(
                1,
                Math.ceil(rows[myIndex - 1].score - rows[myIndex].score)
              ).toLocaleString()} points to pass ${rows[myIndex - 1].name}.`
            : "You lead the board."}
        </span>
      </div>

      {/* Full ranking table */}
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
            {rows.map((r, i) => {
              const tier = getTierForRating(r.rating);
              const bgGrad = AVG[(r.name.length + i) % 3];

              return (
                <tr key={i} className={r.isMe ? "me" : ""}>
                  <td>{i + 1}</td>
                  <td>
                    <span
                      className="av sm"
                      style={{ background: bgGrad, marginRight: "8px" }}
                    >
                      {r.avatar}
                    </span>
                    {r.name}
                  </td>
                  <td>
                    <span className="tbg" style={{ "--tc": tier.color }}>
                      {tier.full}
                    </span>
                  </td>
                  <td>{r.rating}</td>
                  <td>{Math.floor(r.score).toLocaleString()}</td>
                  <td>🔥 {r.streak}</td>
                  <td>{r.strictPct}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mu" style={{ marginTop: "12px" }}>
        Sample data for everyone except you. Rating shows skill, score shows total work.
      </p>
    </div>
  );
}