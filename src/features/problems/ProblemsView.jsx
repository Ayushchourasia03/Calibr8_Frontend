import { useState, useMemo } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { PROBLEMS_CATALOG } from "../../data/problemsCatalog";
import { TOPS, DIFFICULTY_LABELS } from "../../data/constants";

export function ProblemsView() {
  const { state, openProblemInSolver } = useCalibr8();

  const [query, setQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState(-1);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState("rec");
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 25;

  // Stats calculation
  const stats = useMemo(() => {
    const total = [0, 0, 0];
    const solved = [0, 0, 0];
    const sMap = state.solved || {};
    PROBLEMS_CATALOG.forEach((p) => {
      total[p.l]++;
      if (sMap[p.id]) solved[p.l]++;
    });
    return { total, solved };
  }, [state.solved]);

  // Filtered and sorted problems
  const filteredProblems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rr = (topic) => state.ratings?.[topic] ?? state.rating ?? 1200;
    const sMap = state.solved || {};
    const uLevels = state.levels || {};

    const calcScore = (c) =>
      Math.abs(c.d - (rr(c.t) - 147)) +
      (c.t in uLevels ? 0 : 200) +
      (sMap[c.id] ? 5000 : 0);

    const result = PROBLEMS_CATALOG.filter((c) => {
      if (selectedDifficulty >= 0 && c.l !== selectedDifficulty) return false;
      if (selectedTopic && c.t !== selectedTopic) return false;
      if (selectedStatus === "solved" && !sMap[c.id]) return false;
      if (selectedStatus === "todo" && sMap[c.id]) return false;
      if (
        q &&
        !(
          c.title.toLowerCase().includes(q) ||
          c.t.toLowerCase().includes(q) ||
          `#${c.id}`.includes(q)
        )
      ) {
        return false;
      }
      return true;
    });

    result.sort((x, y) => {
      switch (selectedSort) {
        case "acd":
          return y.ac - x.ac;
        case "aca":
          return x.ac - y.ac;
        case "pts":
          return y.pts - x.pts || x.id - y.id;
        case "new":
          return y.id - x.id;
        case "id":
          return x.id - y.id;
        case "rec":
        default:
          return calcScore(x) - calcScore(y);
      }
    });

    return result;
  }, [
    query,
    selectedDifficulty,
    selectedTopic,
    selectedStatus,
    selectedSort,
    state.solved,
    state.levels,
    state.ratings,
    state.rating,
  ]);

  const solvedMap = useMemo(() => state.solved || {}, [state.solved]);
  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const rows = filteredProblems.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  const recommendations =
    selectedSort === "rec" && !query && currentPage === 0
      ? filteredProblems.slice(0, 3)
      : filteredProblems.slice(0, 3);

  // Topics coverage
  const topicsCoverage = useMemo(() => {
    const map = {};
    TOPS.forEach((t) => {
      map[t] = { total: 0, solved: 0 };
    });
    PROBLEMS_CATALOG.forEach((p) => {
      if (map[p.t]) {
        map[p.t].total++;
        if (solvedMap[p.id]) map[p.t].solved++;
      }
    });
    return map;
  }, [solvedMap]);

  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <h1>Problems Catalog</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          5,000 algorithmic challenges spanning 16 data structure & algorithm topics.
        </p>
      </div>

      <div className="pgrid">
        {/* Left Column: Filters & Topic Coverage */}
        <aside>
          <div className="card">
            <h3>Filters</h3>
            <div className="vfb">
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                <button
                  className={`pill ${selectedDifficulty === -1 ? "on" : ""}`}
                  style={{ flex: 1, padding: "5px 8px", fontSize: "12px" }}
                  onClick={() => {
                    setSelectedDifficulty(-1);
                    setPage(0);
                  }}
                >
                  All
                </button>
                <button
                  className={`pill ${selectedDifficulty === 0 ? "on" : ""}`}
                  style={{ flex: 1, padding: "5px 8px", fontSize: "12px" }}
                  onClick={() => {
                    setSelectedDifficulty(0);
                    setPage(0);
                  }}
                >
                  Easy
                </button>
                <button
                  className={`pill ${selectedDifficulty === 1 ? "on" : ""}`}
                  style={{ flex: 1, padding: "5px 8px", fontSize: "12px" }}
                  onClick={() => {
                    setSelectedDifficulty(1);
                    setPage(0);
                  }}
                >
                  Medium
                </button>
                <button
                  className={`pill ${selectedDifficulty === 2 ? "on" : ""}`}
                  style={{ flex: 1, padding: "5px 8px", fontSize: "12px" }}
                  onClick={() => {
                    setSelectedDifficulty(2);
                    setPage(0);
                  }}
                >
                  Hard
                </button>
              </div>

              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Topics (16)</option>
                {TOPS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Statuses</option>
                <option value="todo">Unsolved Only</option>
                <option value="solved">Solved Only</option>
              </select>

              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setPage(0);
                }}
              >
                <option value="rec">Sort: Recommended for You</option>
                <option value="pts">Sort: Highest Points</option>
                <option value="acd">Sort: Highest Acceptance</option>
                <option value="aca">Sort: Lowest Acceptance</option>
                <option value="new">Sort: Newest First</option>
                <option value="id">Sort: Question Number</option>
              </select>
            </div>
          </div>

          <div className="card">
            <h3>Topic Coverage</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto" }}>
              {TOPS.slice(0, 8).map((t) => {
                const item = topicsCoverage[t] || { total: 1, solved: 0 };
                const pct = Math.round((item.solved / item.total) * 100);
                return (
                  <div key={t}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                      <span>{t}</span>
                      <span className="mu">
                        {item.solved}/{item.total}
                      </span>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center Column: Questions Table */}
        <section>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <h2>
                Questions <b>({filteredProblems.length})</b>
              </h2>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search by title, topic, #id..."
                style={{ width: "220px", maxWidth: "100%", padding: "6px 12px", borderRadius: "999px" }}
              />
            </div>

            <table className="pl">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>#</th>
                  <th>Title</th>
                  <th>Topic</th>
                  <th>Diff</th>
                  <th style={{ textAlign: "right" }}>Accept</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const isSolved = solvedMap[p.id];
                  const diffClass = ["dE", "dM", "dH"][p.l];
                  return (
                    <tr
                      key={p.id}
                      data-id={p.id}
                      onClick={() => openProblemInSolver(p)}
                    >
                      <td className="mu">{p.id}</td>
                      <td>
                        <b>{p.title}</b>
                        {isSolved && (
                          <span className="ok" style={{ marginLeft: "6px", fontSize: "12px" }}>
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="mu">{p.t}</td>
                      <td>
                        <span className={`dc ${diffClass}`}>
                          {DIFFICULTY_LABELS[p.l]}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }} className="mu">
                        {p.ac}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pg">
              <button
                className="btn ghost"
                disabled={currentPage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ‹ Prev
              </button>
              <span className="mu" style={{ fontSize: "13px" }}>
                Page <b>{currentPage + 1}</b> of <b>{totalPages}</b>
              </span>
              <button
                className="btn ghost"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next ›
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Recommendations & Difficulty Breakdown */}
        <aside>
          <div className="card">
            <h3>Recommended Next</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recommendations.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "8px 10px",
                    background: "var(--cf)",
                    borderRadius: "8px",
                    border: "1px solid var(--ln)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: "13px" }}>{p.title}</b>
                    <span className={`dc d${["E", "M", "H"][p.l]}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                      {DIFFICULTY_LABELS[p.l]}
                    </span>
                  </div>
                  <div className="mu" style={{ fontSize: "11px", margin: "4px 0 6px" }}>
                    {p.t} • {p.pts} Pts
                  </div>
                  <button
                    className="btn"
                    style={{ fontSize: "11px", padding: "3px 10px", width: "100%" }}
                    onClick={() => openProblemInSolver(p)}
                  >
                    Solve Now →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Difficulty Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[0, 1, 2].map((lvl) => {
                const sCount = stats.solved[lvl];
                const tCount = stats.total[lvl];
                const pct = Math.round((sCount / tCount) * 100);
                const color = lvl === 0 ? "#2ED47A" : lvl === 1 ? "#E59A00" : "#FF5C7A";

                return (
                  <div key={lvl}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                      <span style={{ color, fontWeight: 600 }}>
                        {DIFFICULTY_LABELS[lvl]}
                      </span>
                      <span className="mu">
                        {sCount}/{tCount} ({pct}%)
                      </span>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
