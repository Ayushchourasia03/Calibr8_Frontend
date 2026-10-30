import { useEffect, useState } from "react";
import { studyApi } from "./studyApi";
import { useCalibr8 } from "../../context/Calibr8Context";

function StudyContent({ content }) {
  const lines = (content || "").split(/\r?\n/);
  const blocks = [];
  let codeLines = [];
  let inCode = false;

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        blocks.push(
          <pre key={`code-${index}`} className="card">
            <code>{codeLines.join("\n")}</code>
          </pre>,
        );
        codeLines = [];
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(line);
    } else if (line.startsWith("# ")) {
      blocks.push(<h3 key={index}>{line.slice(2)}</h3>);
    } else if (line.startsWith("## ")) {
      blocks.push(<h4 key={index}>{line.slice(3)}</h4>);
    } else if (line.startsWith("### ")) {
      blocks.push(<h4 key={index}>{line.slice(4)}</h4>);
    } else if (/^\s*[-*]\s/.test(line)) {
      blocks.push(
        <p key={index} className="mu">
          • {line.replace(/^\s*[-*]\s/, "")}
        </p>,
      );
    } else if (line.trim() && !/^---+$/.test(line.trim())) {
      blocks.push(
        <p key={index} style={{ whiteSpace: "pre-wrap" }}>
          {line}
        </p>,
      );
    }
  });

  if (codeLines.length) {
    blocks.push(
      <pre key="code-end" className="card">
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
  }
  return <div className="space-y-2">{blocks}</div>;
}

export function LibraryView() {
  const { state, setState } = useCalibr8();
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectRetry, setSubjectRetry] = useState(0);
  const [loadingSubject, setLoadingSubject] = useState(() =>
    Boolean(state.librarySubjectSlug),
  );
  const [subjectReload, setSubjectReload] = useState(0);
  const [error, setError] = useState("");
  const [openChapter, setOpenChapter] = useState(null);
  const [chapterTopics, setChapterTopics] = useState({});
  const [loadingChapter, setLoadingChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");

  useEffect(() => {
    let active = true;
    studyApi
      .getSubjects()
      .then((result) => {
        if (!active) return;
        if (!Array.isArray(result)) {
          throw new Error("The study subjects response was invalid.");
        }
        setSubjects(result);
        setError("");
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load study subjects.");
      })
      .finally(() => {
        if (active) setLoadingSubjects(false);
      });
    return () => {
      active = false;
    };
  }, [subjectRetry]);

  useEffect(() => {
    if (!state.librarySubjectSlug) return undefined;
    let active = true;
    studyApi
      .getSubject(state.librarySubjectSlug)
      .then((result) => {
        if (active) {
          setSubject(result);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load this subject.");
      })
      .finally(() => {
        if (active) setLoadingSubject(false);
      });
    return () => {
      active = false;
    };
  }, [state.librarySubjectSlug, subjectReload]);

  const selectSubject = (slug) => {
    setLoadingSubject(true);
    setError("");
    setSubject(null);
    setState((current) => ({ ...current, librarySubjectSlug: slug }));
    setSubjectReload((current) => current + 1);
    setOpenChapter(null);
    setChapterTopics({});
  };

  const toggleChapter = async (chapter) => {
    if (openChapter === chapter.id) {
      setOpenChapter(null);
      return;
    }
    setOpenChapter(chapter.id);
    if (chapterTopics[chapter.id]) return;

    setLoadingChapter(chapter.id);
    setError("");
    try {
      const result = await studyApi.getChapterTopics(chapter.id);
      if (!Array.isArray(result)) {
        throw new Error("The chapter topics response was invalid.");
      }
      setChapterTopics((current) => ({ ...current, [chapter.id]: result }));
    } catch (err) {
      setError(err.message || "Could not load chapter topics.");
    } finally {
      setLoadingChapter(null);
    }
  };

  const openTopic = async (topic) => {
    setLoadingTopic(true);
    setError("");
    setSelectedTopic(null);
    setAnswers({});
    setQuizResult(null);
    setQuizError("");
    try {
      const result = await studyApi.getTopicDetail(topic.slug);
      setSelectedTopic(result);
    } catch (err) {
      setError(err.message || "Could not load this study material.");
    } finally {
      setLoadingTopic(false);
    }
  };

  const submitQuiz = async () => {
    if (!selectedTopic) return;
    setSubmittingQuiz(true);
    setQuizError("");
    try {
      const result = await studyApi.submitQuiz(selectedTopic.slug, answers);
      setQuizResult(result);
    } catch (err) {
      setQuizError(err.message || "Could not submit the quiz.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const quizResultById = new Map(
    (quizResult?.result || []).map((item) => [item.mcqId, item]),
  );
  const mcqs = selectedTopic?.mcqs || [];

  return (
    <div>
      <h1>Library</h1>
      <p className="mu">
        Browse backend study subjects, chapters, lessons, and practice questions.
      </p>

      {loadingSubjects && <p className="mu">Loading study subjects…</p>}
      {error && (
        <div className="card" role="alert">
          <p>{error}</p>
          <button
            className="btn ghost"
            onClick={() => {
              if (subject) {
                selectSubject(subject.slug);
              } else {
                setLoadingSubjects(true);
                setSubjectRetry((value) => value + 1);
              }
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loadingSubjects && subjects.length === 0 && !error && (
        <p className="mu">No study subjects are available yet.</p>
      )}

      <div className="row">
        {subjects.map((item) => (
          <button
            key={item.id}
            className={`pill ${subject?.slug === item.slug ? "on" : ""}`}
            onClick={() => selectSubject(item.slug)}
          >
            {item.icon ? `${item.icon} ` : ""}
            {item.name}
          </button>
        ))}
      </div>

      {loadingSubject && <p className="mu">Loading chapters…</p>}
      {subject && (
        <section>
          <h2>{subject.name}</h2>
          {subject.description && <p className="mu">{subject.description}</p>}
          {subject.chapters?.length ? (
            <div className="grid">
              {subject.chapters.map((chapter) => (
                <article className="card" key={chapter.id}>
                  <button
                    className="btn ghost"
                    aria-expanded={openChapter === chapter.id}
                    onClick={() => toggleChapter(chapter)}
                  >
                    {openChapter === chapter.id ? "−" : "+"} {chapter.name}
                    {chapter._count?.topics != null
                      ? ` · ${chapter._count.topics} topics`
                      : ""}
                  </button>
                  {openChapter === chapter.id && (
                    <div className="space-y-2" style={{ marginTop: 12 }}>
                      {loadingChapter === chapter.id && (
                        <p className="mu">Loading topics…</p>
                      )}
                      {(chapterTopics[chapter.id] || []).map((topic) => (
                        <button
                          key={topic.id}
                          className="btn ghost"
                          style={{ display: "block", width: "100%", textAlign: "left" }}
                          onClick={() => openTopic(topic)}
                        >
                          {topic.name}
                        </button>
                      ))}
                      {chapterTopics[chapter.id]?.length === 0 && (
                        <p className="mu">No topics in this chapter yet.</p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mu">This subject has no chapters yet.</p>
          )}
        </section>
      )}

      {loadingTopic && <p className="mu">Loading study material…</p>}
      {selectedTopic && (
        <div
          className="modal"
          role="presentation"
          onClick={(event) => {
            if (event.target.classList.contains("modal")) setSelectedTopic(null);
          }}
        >
          <section className="sheet" role="dialog" aria-modal="true">
            <button
              className="x"
              aria-label="Close study material"
              onClick={() => setSelectedTopic(null)}
            >
              &times;
            </button>
            <h2>{selectedTopic.name}</h2>
            <StudyContent content={selectedTopic.content} />

            {mcqs.length > 0 && (
              <section>
                <h3>Practice questions</h3>
                {mcqs.map((mcq) => {
                  const result = quizResultById.get(mcq.id);
                  return (
                    <fieldset className="card" key={mcq.id}>
                      <legend>{mcq.question}</legend>
                      {(mcq.options || []).map((option, index) => (
                        <label
                          key={index}
                          className="tr"
                          style={{
                            borderColor:
                              result?.correctIndex === index
                                ? "#2ED47A"
                                : result && answers[mcq.id] === index
                                  ? "#FF5C7A"
                                  : undefined,
                          }}
                        >
                          <input
                            type="radio"
                            name={mcq.id}
                            checked={answers[mcq.id] === index}
                            disabled={Boolean(quizResult)}
                            onChange={() =>
                              setAnswers((current) => ({
                                ...current,
                                [mcq.id]: index,
                              }))
                            }
                          />
                          {option}
                        </label>
                      ))}
                      {result && (
                        <p className={result.isCorrect ? "ok" : "mu"}>
                          {result.isCorrect ? "Correct. " : "Incorrect. "}
                          {result.explanation}
                        </p>
                      )}
                    </fieldset>
                  );
                })}
                {quizError && <p role="alert">{quizError}</p>}
                {quizResult ? (
                  <p className="ok">
                    Score: {quizResult.score} / {quizResult.total}
                  </p>
                ) : (
                  <button
                    className="btn"
                    disabled={
                      submittingQuiz ||
                      mcqs.length === 0 ||
                      Object.keys(answers).length !== mcqs.length
                    }
                    onClick={submitQuiz}
                  >
                    {submittingQuiz ? "Submitting…" : "Submit answers"}
                  </button>
                )}
              </section>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
