import { useEffect, useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { topicsApi } from "./topicsApi";
import { studyApi } from "../library/studyApi";

export function TracksView() {
  const { openProblemInSolver, setState, setView } = useCalibr8();
  const [categories, setCategories] = useState([]);
  const [studySubjects, setStudySubjects] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [error, setError] = useState("");
  const [categoryRetry, setCategoryRetry] = useState(0);

  useEffect(() => {
    let active = true;
    topicsApi
      .getCategories()
      .then((result) => {
        if (!Array.isArray(result)) {
          throw new Error("The topic categories response was invalid.");
        }
        if (active) {
          setCategories(result);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load practice tracks.");
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });
    return () => {
      active = false;
    };
  }, [categoryRetry]);

  useEffect(() => {
    let active = true;
    studyApi
      .getSubjects()
      .then((result) => {
        if (!Array.isArray(result)) {
          throw new Error("The study subjects response was invalid.");
        }
        if (active) setStudySubjects(result);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load learning tracks.");
      })
      .finally(() => {
        if (active) setLoadingSubjects(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openCategory = async (category) => {
    setSelectedCategory(category);
    setLoadingProblems(true);
    setError("");
    try {
      const result = await topicsApi.getCategoryProblems(category.slug);
      if (!Array.isArray(result?.problems)) {
        throw new Error("The category problems response was invalid.");
      }
      setProblems(result.problems);
    } catch (err) {
      setProblems([]);
      setError(err.message || "Could not load this practice track.");
    } finally {
      setLoadingProblems(false);
    }
  };

  const openStudySubject = (slug) => {
    setState((current) => ({ ...current, librarySubjectSlug: slug }));
    setView("library");
  };

  return (
    <div>
      <h1>Tracks</h1>
      <p className="mu">
        Practice with the backend problem catalog or follow a subject-based learning track.
      </p>

      <section>
        <h2>DSA practice</h2>
        {loadingCategories && <p className="mu">Loading practice tracks…</p>}
      </section>
      {error && (
        <div className="card" role="alert">
          <p>{error}</p>
          <button
            className="btn ghost"
            onClick={() => {
              if (selectedCategory) {
                openCategory(selectedCategory);
              } else {
                setLoadingCategories(true);
                setCategoryRetry((value) => value + 1);
              }
            }}
          >
            Retry
          </button>
        </div>
      )}
      {!loadingCategories && categories.length === 0 && !error && (
        <p className="mu">No practice tracks are available yet.</p>
      )}

      <div className="grid tk">
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={`card ${selectedCategory?.id === category.id ? "on" : ""}`}
            onClick={() => openCategory(category)}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <h3>{category.name}</h3>
            <p className="mu">
              {category.totalProblems ?? 0} backend problems
            </p>
          </button>
        ))}
      </div>

      <section>
        <h2>Study tracks</h2>
        <p className="mu">
          Open backend-maintained study material by subject and continue into its chapters and lessons.
        </p>
        {loadingSubjects && <p className="mu">Loading study tracks…</p>}
        {!loadingSubjects && studySubjects.length === 0 && !error && (
          <p className="mu">No study tracks are available yet.</p>
        )}
        <div className="grid tk">
          {studySubjects.map((subject) => (
            <article className="card" key={subject.id}>
              <h3>
                {subject.icon ? `${subject.icon} ` : ""}
                {subject.name}
              </h3>
              <p className="mu">{subject.description}</p>
              <p className="mu">
                {subject._count?.chapters ?? 0} chapters
              </p>
              <button
                className="btn ghost"
                onClick={() => openStudySubject(subject.slug)}
              >
                Browse study track
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedCategory && (
        <section>
          <h2>{selectedCategory.name}</h2>
          {loadingProblems && <p className="mu">Loading problems…</p>}
          {!loadingProblems && !error && problems.length === 0 && (
            <p className="mu">No problems are available in this track yet.</p>
          )}
          {!loadingProblems && problems.length > 0 && (
            <div className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Problem</th>
                    <th>Difficulty</th>
                    <th>Practice</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((problem) => (
                    <tr key={problem.id}>
                      <td>{problem.problemNumber || "—"}</td>
                      <td>{problem.title}</td>
                      <td>{problem.difficulty}</td>
                      <td>
                        <button
                          className="btn ghost"
                          onClick={() => openProblemInSolver(problem)}
                        >
                          Solve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
