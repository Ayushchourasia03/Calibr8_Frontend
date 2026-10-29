import { useState, useMemo } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { TOPS, DIFFICULTY_LABELS } from "../../data/constants";
import { PROBLEMS_CATALOG } from "../../data/problemsCatalog";

const accFor = (q) => {
  if (q.ac !== undefined) return q.ac;
  const a = [
    [55, 85],
    [35, 60],
    [18, 42],
  ][q.l || 0];
  const h =
    [...(q.key || q.title || "x")].reduce(
      (s, c) => (s * 31 + c.charCodeAt(0)) >>> 0,
      7
    ) / 4294967296;
  return Math.round((a[0] + h * (a[1] - a[0])) * 10) / 10;
};

export function ProblemsView() {
  const { state, setView, openProblemInSolver } = useCalibr8();

  const query = state.searchQuery || "";
  const [selectedDifficulty, setSelectedDifficulty] = useState(-1);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState("id");
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 25;
  const userSolvedMap = useMemo(() => state.solved || {}, [state.solved]);
  const userLevels = useMemo(() => state.levels || {}, [state.levels]);

  const spot = (t) => {
    if (!(t in userLevels)) return "n";
    const userRating = state.ratings?.[t] ?? state.rating ?? 1200;
    const base = [800, 1200, 1600][userLevels[t]];
    const d = userRating - base;
    return d >= 50 ? "g" : d <= -50 ? "w" : "b";
  };

  const dotTitle = (s) =>
    s === "g" ? "Good" : s === "b" ? "Better" : s === "w" ? "Weak" : "Not started";

  // Difficulty counts across catalog
  const { cnt, sd } = useMemo(() => {
    const total = [0, 0, 0];
    const solved = [0, 0, 0];
    PROBLEMS_CATALOG.forEach((c) => {
      total[c.l]++;
      if (userSolvedMap[c.id]) solved[c.l]++;
    });
    return { cnt: total, sd: solved };
  }, [userSolvedMap]);

  // Topic counts across catalog
  const topicCounts = useMemo(() => {
    const map = {};
    TOPS.forEach((t) => (map[t] = 0));
    PROBLEMS_CATALOG.forEach((c) => {
      map[c.t] = (map[c.t] || 0) + 1;
    });
    return map;
  }, []);

  // Filter & sort problems
  const filteredProblems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rr = (t) => state.ratings?.[t] ?? state.rating ?? 1200;
    const sc = (c) =>
      Math.abs(c.d - (rr(c.t) - 147)) +
      (c.t in userLevels ? 0 : 200) +
      (userSolvedMap[c.id] ? 5000 : 0);

    const res = PROBLEMS_CATALOG.filter((c) => {
      if (selectedDifficulty >= 0 && c.l !== selectedDifficulty) return false;
      if (selectedTopic && c.t !== selectedTopic) return false;
      if (selectedStatus === "solved" && !userSolvedMap[c.id]) return false;
      if (selectedStatus === "todo" && userSolvedMap[c.id]) return false;
      if (
        q &&
        !(
          c.title +
          " " +
          c.t +
          " " +
          DIFFICULTY_LABELS[c.l] +
          " #" +
          c.id
        )
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });

    res.sort((x, y) => {
      switch (selectedSort) {
        case "rec":
          return sc(x) - sc(y);
        case "acd":
          return y.ac - x.ac;
        case "aca":
          return x.ac - y.ac;
        case "pts":
          return y.pts - x.pts || x.id - y.id;
        case "new":
          return y.id - x.id;
        case "id":
        default:
          return x.id - y.id;
      }
    });

    return res;
  }, [
    query,
    selectedDifficulty,
    selectedTopic,
    selectedStatus,
    selectedSort,
    userSolvedMap,
    userLevels,
    state.ratings,
    state.rating,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const rows = filteredProblems.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const pin = state.dailyDone ? state.stretch : state.daily;

  const handleDifficultyClick = (lvl) => {
    setSelectedDifficulty((prev) => (prev === lvl ? -1 : lvl));
    setPage(0);
  };

  const handleTopicClick = (t) => {
    setSelectedTopic((prev) => (prev === t ? "" : t));
    setPage(0);
  };

  return (
    <div>
      <h1>Problems</h1>
      <p className="mu">
        Catalog preview: 5,000 slots across {TOPS.length} topics. Titles are placeholders until the real, original problems are written.
      </p>

      <div className="pgrid">
        {/* Left Column */}
        <aside>
          <div className="card">
            <h3>Progress</h3>
            {[0, 1, 2].map((l) => (
              <div key={l}>
                <div className="mu">
                  <span className={`dc d${"EMH"[l]}`}>{DIFFICULTY_LABELS[l]}</span>{" "}
                  {sd[l]} of {cnt[l]}
                </div>
                <div className="bar">
                  <i
                    style={{
                      width: `${cnt[l] ? (sd[l] / cnt[l]) * 100 : 0}%`,
                    }}
                  ></i>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Topics</h3>
            <div style={{ maxHeight: "340px", overflow: "auto" }}>
              {TOPS.map((t) => {
                const sp = spot(t);
                const isSelected = selectedTopic === t;
                return (
                  <div
                    key={t}
                    className="tr tpq"
                    data-t={t}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleTopicClick(t)}
                  >
                    <span>
                      <i className={`sp ${sp}`} title={dotTitle(sp)}></i>
                      <b className={isSelected ? "ok" : ""}>{t}</b>
                    </span>
                    <span className="mu">{topicCounts[t] || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center Column */}
        <section>
          <div className="fbar">
            {[
              ["All", -1],
              ["Easy", 0],
              ["Medium", 1],
              ["Hard", 2],
            ].map(([n, i]) => (
              <button
                key={n}
                className={`pill ${selectedDifficulty === i ? "on" : ""}`}
                data-l={i}
                onClick={() => handleDifficultyClick(i)}
              >
                {n}
              </button>
            ))}

            <select
              id="ft"
              aria-label="Topic"
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All topics</option>
              {TOPS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              id="fs"
              aria-label="Status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Any status</option>
              <option value="solved">Solved</option>
              <option value="todo">Not solved</option>
            </select>

            <select
              id="fo"
              aria-label="Sort"
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setPage(0);
              }}
            >
              <option value="id">Question number</option>
              <option value="rec">Recommended</option>
              <option value="acd">Acceptance: high to low</option>
              <option value="aca">Acceptance: low to high</option>
              <option value="pts">Most points</option>
            </select>
          </div>

          <div className="card pl" style={{ overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Acceptance</th>
                  <th>Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pin && currentPage === 0 && !query.trim() && (
                  <tr
                    className="pinr"
                    data-pin="1"
                    onClick={() => openProblemInSolver(pin)}
                  >
                    <td>★</td>
                    <td>
                      <b>{pin.title}</b>{" "}
                      <span className="tag" style={{ color: "#FFB020" }}>
                        {state.dailyDone ? "Stretch" : "Today"}
                      </span>
                    </td>
                    <td>
                      <span className="tag">{pin.topic}</span>
                    </td>
                    <td>
                      <span className={`dc d${"EMH"[pin.l]}`}>
                        {DIFFICULTY_LABELS[pin.l]}
                      </span>
                    </td>
                    <td>{accFor(pin)}%</td>
                    <td>{pin.pts}</td>
                    <td className="mu">
                      {state.dailyDone ? "Open" : "Strict only"}
                    </td>
                  </tr>
                )}

                {rows.length > 0 ? (
                  rows.map((c) => (
                    <tr
                      key={c.id}
                      data-id={c.id}
                      onClick={() => openProblemInSolver(c)}
                    >
                      <td>{c.id}</td>
                      <td>{c.title}</td>
                      <td>
                        <span className="tag">{c.t}</span>
                      </td>
                      <td>
                        <span className={`dc d${"EMH"[c.l]}`}>
                          {DIFFICULTY_LABELS[c.l]}
                        </span>
                      </td>
                      <td>{c.ac}%</td>
                      <td>{c.pts}</td>
                      <td>
                        {userSolvedMap[c.id] ? (
                          <span className="ok">Solved</span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="mu">
                      No questions match. Try clearing a filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pg">
            <button
              className="btn ghost"
              id="pp"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span className="mu">
              Page {currentPage + 1} of {totalPages} &middot;{" "}
              {filteredProblems.length.toLocaleString()} questions
            </span>
            <button
              className="btn ghost"
              id="pn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </button>
          </div>
        </section>

        {/* Right Column */}
        <aside>
          <div className="card">
            <h3>How points work</h3>
            <p className="mu">
              Tier 1 earns 30% of a question&apos;s points, Tier 2 earns 65%, Tier 3 earns 100%. Strict mode earns 1.5x. Hints cost 5%, 10% and 20%. Improving an old result adds only the difference.
            </p>
          </div>
          <div className="card">
            <h3>Jump to</h3>
            <div className="row">
              <button
                className="btn ghost ql"
                data-v="home"
                onClick={() => setView("home")}
              >
                Today
              </button>
              <button
                className="btn ghost ql"
                data-v="library"
                onClick={() => setView("library")}
              >
                Library
              </button>
              <button
                className="btn ghost ql"
                data-v="tracks"
                onClick={() => setView("tracks")}
              >
                Tracks
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
