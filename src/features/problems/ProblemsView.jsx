import { useEffect, useMemo, useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { DIFFICULTY_LABELS } from "../../data/constants";
import { problemsApi } from "./problemsApi";

const difficultyIndex = (difficulty) => {
  const normalized = String(difficulty || "").toLowerCase();
  const index = DIFFICULTY_LABELS.findIndex(
    (label) => label.toLowerCase() === (normalized === "mid" ? "medium" : normalized)
  );
  return index < 0 ? 0 : index;
};

export function ProblemsView() {
  const { state, setView, openProblemInSolver } = useCalibr8();

  const query = state.searchQuery || "";
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState(-1);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState("id");
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 25;
  const userLevels = useMemo(() => state.levels || {}, [state.levels]);

  useEffect(() => {
    const controller = new AbortController();

    problemsApi
      .getAll({ signal: controller.signal })
      .then((response) => {
        if (!Array.isArray(response?.data)) {
          throw new Error("The problems API returned an invalid catalog.");
        }
        setProblems(response.data);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setLoadError(error.message || "Unable to load problems.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const catalog = useMemo(
    () =>
      problems.map((problem) => ({
        ...problem,
        id: problem.problemNumber,
        t: problem.topic || "Other",
        l: difficultyIndex(problem.difficulty),
        ac: problem.acceptanceRate,
        pts: problem.points,
      })),
    [problems]
  );

  const topics = useMemo(
    () => [...new Set(catalog.map((problem) => problem.t))].sort((a, b) => a.localeCompare(b)),
    [catalog]
  );

  const spot = (t) => {
    if (!(t in userLevels)) return "n";
    const userRating = state.ratings?.[t] ?? state.rating ?? 1200;
    const base = [800, 1200, 1600][userLevels[t]];
    const d = userRating - base;
    return d >= 50 ? "g" : d <= -50 ? "w" : "b";
  };

  const dotTitle = (s) =>
    s === "g" ? "Good" : s === "b" ? "Better" : s === "w" ? "Weak" : "Not started";

  const { cnt, sd } = useMemo(() => {
    const total = [0, 0, 0];
    const solved = [0, 0, 0];
    catalog.forEach((c) => {
      total[c.l]++;
      if (c.isSolved) solved[c.l]++;
    });
    return { cnt: total, sd: solved };
  }, [catalog]);

  const topicCounts = useMemo(() => {
    const map = {};
    catalog.forEach((c) => {
      map[c.t] = (map[c.t] || 0) + 1;
    });
    return map;
  }, [catalog]);

  const filteredProblems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const recommendationScore = (problem) => {
      const rating = state.ratings?.[problem.t] ?? state.rating ?? 1200;
      const targetDifficulty = rating < 1000 ? 0 : rating < 1400 ? 1 : 2;
      return (
        Math.abs(problem.l - targetDifficulty) +
        (problem.t in userLevels ? 0 : 1) +
        (problem.isSolved ? 3 : 0)
      );
    };

    const res = catalog.filter((c) => {
      if (selectedDifficulty >= 0 && c.l !== selectedDifficulty) return false;
      if (selectedTopic && c.t !== selectedTopic) return false;
      if (selectedStatus === "solved" && !c.isSolved) return false;
      if (selectedStatus === "todo" && c.isSolved) return false;
      if (
        q &&
        !(
          `${c.title} ${c.slug} ${c.t} ${c.difficulty} ${(c.tags || []).join(" ")} #${c.id}`
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
          return recommendationScore(x) - recommendationScore(y) || x.id - y.id;
        case "acd":
          return (y.ac ?? -1) - (x.ac ?? -1);
        case "aca":
          return (x.ac ?? Number.POSITIVE_INFINITY) - (y.ac ?? Number.POSITIVE_INFINITY);
        case "pts":
          return y.pts - x.pts || x.id - y.id;
        case "id":
        default:
          return x.id - y.id;
      }
    });

    return res;
  }, [
    catalog,
    query,
    selectedDifficulty,
    selectedTopic,
    selectedStatus,
    selectedSort,
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
        Browse {catalog.length.toLocaleString()} problems from the backend catalog.
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
              {topics.map((t) => {
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
              {topics.map((t) => (
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="mu">Loading problems…</td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={7} role="alert">{loadError}</td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((c) => (
                    <tr
                      key={c.slug}
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
                      <td>{c.ac == null ? "—" : `${c.ac}%`}</td>
                      <td>{c.pts}</td>
                      <td>
                        {c.isSolved ? (
                          <span className="ok">Solved</span>
                        ) : (
                          <span className="mu">Unsolved</span>
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
              disabled={currentPage === 0 || loading || Boolean(loadError)}
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
              disabled={currentPage >= totalPages - 1 || loading || Boolean(loadError)}
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
