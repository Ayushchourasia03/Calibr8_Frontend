import { useState, useMemo, useEffect } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { DIFFICULTY_LABELS } from "../../data/constants";
import { api } from "../../services/api";

export function ProblemsView() {
  const { state, openProblemInSolver } = useCalibr8();

  const [query, setQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState(-1);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState("rec");
  const [page, setPage] = useState(0);

  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [solvedStatusMap, setSolvedStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [refetchTick, setRefetchTick] = useState(0);

  const PAGE_SIZE = 25;

  // 1. Fetch DSA categories and user solve status from BE
  useEffect(() => {
    let isMounted = true;

    async function fetchMetadata() {
      try {
        const catRes = await api.topics.getCategories();
        if (isMounted && Array.isArray(catRes)) {
          setCategories(catRes);
        }
      } catch (err) {
        console.warn("Could not fetch categories from BE:", err.message);
      }

      try {
        const solvedRes = await api.users.getSolvedProblems();
        if (isMounted && solvedRes?.data && Array.isArray(solvedRes.data)) {
          const sMap = {};
          solvedRes.data.forEach((p) => {
            if (p.isSolved) {
              sMap[p.slug || p.number] = true;
              sMap[p.number] = true;
              sMap[p.name] = true;
            }
          });
          setSolvedStatusMap(sMap);
        }
      } catch {
        // ignore
      }
    }

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch problems list from BE when search, difficulty, or category changes
  // useEffect(() => {
  //   let isMounted = true;

  //   async function fetchProblems() {
  //     setLoading(true);
  //     setError(null);

  //     const diffParam =
  //       selectedDifficulty === 0
  //         ? "Easy"
  //         : selectedDifficulty === 1
  //           ? "Medium"
  //           : selectedDifficulty === 2
  //             ? "Hard"
  //             : undefined;

  //     try {
  //       let rawList = [];

  //       // If a specific topic slug is selected, call dedicated topic problems API
  //       if (selectedTopic) {
  //         try {
  //           const topicRes = await api.topics.getCategoryProblems(selectedTopic, {
  //             difficulty: diffParam,
  //             search: query || undefined,
  //           });
  //           rawList = topicRes?.problems || [];
  //         } catch {
  //           // fallback to general problems API
  //           const res = await api.problems.getAll({
  //             difficulty: diffParam,
  //             search: query || undefined,
  //           });
  //           rawList = res?.data || [];
  //         }
  //       } else {
  //         // General problem catalog dedicated API: GET /api/problems
  //         const res = await api.problems.getAll({
  //           difficulty: diffParam,
  //           search: query || undefined,
  //         });
  //         rawList = res?.data || [];
  //       }

  //       if (isMounted) {
  //         if (Array.isArray(rawList)) {
  //           const mapped = rawList.map((p, idx) => {
  //             const diffStr = (p.difficulty || "Easy").toLowerCase();
  //             const l = diffStr === "hard" ? 2 : diffStr === "medium" ? 1 : 0;
  //             const probNum = p.problemNumber || p.number || idx + 1;
  //             const slug = p.slug || `prob-${probNum}`;
  //             const topicName =
  //               p.topic ||
  //               (p.tags && p.tags[0]) ||
  //               (categories.find((c) => c.slug === selectedTopic)?.name) ||
  //               "DSA Fundamentals";

  //             return {
  //               id: probNum,
  //               problemNumber: probNum,
  //               slug,
  //               title: p.title || p.name || `Problem #${probNum}`,
  //               t: topicName,
  //               l,
  //               d: l === 0 ? 1100 : l === 1 ? 1350 : 1700,
  //               ac: p.solvedPercentage || 68 + ((probNum * 7) % 25),
  //               pts: [10, 25, 50][l],
  //               timeLimit: p.timeLimit,
  //               memoryLimit: p.memoryLimit,
  //               raw: p,
  //             };
  //           });
  //           setProblems(mapped);
  //         } else {
  //           setProblems([]);
  //         }
  //       }
  //     } catch (err) {
  //       if (isMounted) {
  //         console.warn("Could not fetch problems from BE:", err.message);
  //         setError("Failed to load problems from backend server.");
  //         setProblems([]);
  //       }
  //     } finally {
  //       if (isMounted) {
  //         setLoading(false);
  //       }
  //     }
  //   }

  //   fetchProblems();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, [selectedDifficulty, selectedTopic, query, categories]);

  useEffect(() => {
    let isMounted = true;
    async function fetchProblems() {
      setLoading(true);
      setError(null);
      const diffParam =
        selectedDifficulty === 0
          ? "Easy"
          : selectedDifficulty === 1
            ? "Medium"
            : selectedDifficulty === 2
              ? "Hard"
              : undefined;

      try {
        let res;
        if (selectedTopic) {
          try {
            res = await api.topics.getCategoryProblems(selectedTopic, {
              difficulty: diffParam,
              search: query || undefined,
            });
          } catch {
            res = await api.problems.getAll({
              difficulty: diffParam,
              search: query || undefined,
            });
          }
        } else {
          res = await api.problems.getAll({
            difficulty: diffParam,
            search: query || undefined,
          });
        }

        // robust to any shape
        const rawList =
          res?.data?.problems ||
          res?.problems ||
          res?.data ||
          (Array.isArray(res) ? res : []);

        if (isMounted) {
          const mapped = rawList.map((p, idx) => {
            const diffStr = (p.difficulty || "Easy").toLowerCase();
            const l = diffStr === "hard" ? 2 : diffStr === "medium" ? 1 : 0;
            const probNum = p.problemNumber || p.number || p._id || idx + 1;
            return {
              id: probNum,
              problemNumber: probNum,
              slug: p.slug || `prob-${probNum}`,
              title: p.title || p.name || `Problem #${probNum}`,
              t: p.topic || p.tags?.[0] || "DSA Fundamentals",
              l,
              d: l === 0 ? 1100 : l === 1 ? 1350 : 1700,
              ac:
                p.solvedPercentage ?? p.acceptance ?? 68 + ((probNum * 7) % 25),
              pts: [10, 25, 50][l],
              raw: p,
            };
          });
          setProblems(mapped);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setProblems([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProblems();
    return () => {
      isMounted = false;
    };
  }, [selectedDifficulty, selectedTopic, query, refetchTick]); // remove categories from deps

  // fix retry
  // <button onClick={() => setRefetchTick(t => t+1)}>Retry</button>

  // Combined solved status
  const userSolvedMap = useMemo(() => {
    return {
      ...(state.solved || {}),
      ...solvedStatusMap,
    };
  }, [state.solved, solvedStatusMap]);

  // Difficulty & Topic stats
  const stats = useMemo(() => {
    const total = [0, 0, 0];
    const solved = [0, 0, 0];
    problems.forEach((p) => {
      total[p.l]++;
      if (userSolvedMap[p.id] || userSolvedMap[p.slug]) solved[p.l]++;
    });
    return { total, solved };
  }, [problems, userSolvedMap]);

  // Filtered and sorted problems on client (for status & sort orders)
  const filteredProblems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rr = (topic) => state.ratings?.[topic] ?? state.rating ?? 1200;
    const uLevels = state.levels || {};

    const calcScore = (c) =>
      Math.abs(c.d - (rr(c.t) - 147)) +
      (c.t in uLevels ? 0 : 200) +
      (userSolvedMap[c.id] || userSolvedMap[c.slug] ? 5000 : 0);

    const result = problems.filter((c) => {
      const isSolved = userSolvedMap[c.id] || userSolvedMap[c.slug];
      if (selectedStatus === "solved" && !isSolved) return false;
      if (selectedStatus === "todo" && isSolved) return false;

      if (
        q &&
        !(
          c.title.toLowerCase().includes(q) ||
          c.t.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
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
    problems,
    query,
    selectedStatus,
    selectedSort,
    userSolvedMap,
    state.ratings,
    state.rating,
    state.levels,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProblems.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages - 1);
  const rows = filteredProblems.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  const recommendations = filteredProblems.slice(0, 3);

  // Topics coverage breakdown
  const topicsCoverage = useMemo(() => {
    const map = {};
    problems.forEach((p) => {
      if (!map[p.t]) {
        map[p.t] = { total: 0, solved: 0 };
      }
      map[p.t].total++;
      if (userSolvedMap[p.id] || userSolvedMap[p.slug]) {
        map[p.t].solved++;
      }
    });
    return map;
  }, [problems, userSolvedMap]);

  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <h1>Problems Catalog</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          Live catalogue fetched from backend API. Filter by difficulty,
          category, status, or search keywords.
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

              {/* Topic / DSA Category Dropdown */}
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">
                  All Categories ({categories.length || "All"})
                </option>
                {categories.length > 0
                  ? categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} {c.totalProblems ? `(${c.totalProblems})` : ""}
                      </option>
                    ))
                  : [
                      "Arrays & Hashing",
                      "Two Pointers",
                      "Sliding Window",
                      "Stack & Queue",
                      "Binary Search",
                      "Linked List",
                      "Trees",
                      "Tries",
                      "Heap / Priority Queue",
                      "Backtracking",
                      "Graphs",
                      "Advanced Graphs",
                      "1-D Dynamic Programming",
                      "2-D Dynamic Programming",
                      "Greedy",
                      "Intervals",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
              </select>

              {/* Status Filter */}
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

              {/* Sort Order */}
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "320px",
                overflowY: "auto",
              }}
            >
              {Object.keys(topicsCoverage).length > 0 ? (
                Object.keys(topicsCoverage)
                  .slice(0, 10)
                  .map((t) => {
                    const item = topicsCoverage[t] || { total: 1, solved: 0 };
                    const pct = Math.round((item.solved / item.total) * 100);
                    return (
                      <div key={t}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            marginBottom: "3px",
                          }}
                        >
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
                  })
              ) : (
                <div className="mu" style={{ fontSize: "12px" }}>
                  No topic data available
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center Column: Questions Table */}
        <section>
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
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
                style={{
                  width: "220px",
                  maxWidth: "100%",
                  padding: "6px 12px",
                  borderRadius: "999px",
                }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p className="mu">Fetching problem catalogue from backend...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "30px" }}>
                <p className="bad">{error}</p>
                <button
                  className="btn ghost"
                  style={{ marginTop: "10px" }}
                  onClick={() => setRefetchTick((tick) => tick + 1)}
                >
                  Retry Connection
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <h3>No problems match the current filter</h3>
                <p className="mu" style={{ margin: "6px 0 12px" }}>
                  Try adjusting difficulty, search query, or status filter.
                </p>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setSelectedDifficulty(-1);
                    setSelectedTopic("");
                    setSelectedStatus("");
                    setQuery("");
                    setPage(0);
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
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
                      const isSolved =
                        userSolvedMap[p.id] || userSolvedMap[p.slug];
                      const diffClass = ["dE", "dM", "dH"][p.l];
                      return (
                        <tr
                          key={p.slug || p.id}
                          data-id={p.id}
                          onClick={() => openProblemInSolver(p)}
                        >
                          <td className="mu">{p.problemNumber || p.id}</td>
                          <td>
                            <b>{p.title}</b>
                            {isSolved && (
                              <span
                                className="ok"
                                style={{ marginLeft: "6px", fontSize: "12px" }}
                              >
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
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                  >
                    Next ›
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Right Column: Recommendations & Difficulty Breakdown */}
        <aside>
          <div className="card">
            <h3>Recommended Next</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {recommendations.length > 0 ? (
                recommendations.map((p) => (
                  <div
                    key={p.slug || p.id}
                    style={{
                      padding: "8px 10px",
                      background: "var(--cf)",
                      borderRadius: "8px",
                      border: "1px solid var(--ln)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <b style={{ fontSize: "13px" }}>{p.title}</b>
                      <span
                        className={`dc d${["E", "M", "H"][p.l]}`}
                        style={{ fontSize: "10px", padding: "1px 6px" }}
                      >
                        {DIFFICULTY_LABELS[p.l]}
                      </span>
                    </div>
                    <div
                      className="mu"
                      style={{ fontSize: "11px", margin: "4px 0 6px" }}
                    >
                      {p.t} • {p.pts} Pts
                    </div>
                    <button
                      className="btn"
                      style={{
                        fontSize: "11px",
                        padding: "3px 10px",
                        width: "100%",
                      }}
                      onClick={() => openProblemInSolver(p)}
                    >
                      Solve Now →
                    </button>
                  </div>
                ))
              ) : (
                <div className="mu" style={{ fontSize: "12px" }}>
                  No recommendations available
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Difficulty Breakdown</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {[0, 1, 2].map((lvl) => {
                const sCount = stats.solved[lvl];
                const tCount = Math.max(1, stats.total[lvl]);
                const pct = Math.round((sCount / tCount) * 100);
                const color =
                  lvl === 0 ? "#2ED47A" : lvl === 1 ? "#E59A00" : "#FF5C7A";

                return (
                  <div key={lvl}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        marginBottom: "3px",
                      }}
                    >
                      <span style={{ color, fontWeight: 600 }}>
                        {DIFFICULTY_LABELS[lvl]}
                      </span>
                      <span className="mu">
                        {sCount}/{stats.total[lvl]} ({pct}%)
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
