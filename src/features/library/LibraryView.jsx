import { useState, useMemo } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import {
  CURRICULUM,
  STUDY_SHEETS,
  QUESTION_BANKS,
} from "../../data/curriculumData";

export function LibraryView() {
  const { state, setState, setActiveModal, setModalData } = useCalibr8();

  const [activeCatIndex, setActiveCatIndex] = useState(state.libCat || 0);

  // Daily question interaction state
  const [dailySelected, setDailySelected] = useState(null);

  // Practice quiz modal state
  const [activeQuiz, setActiveQuiz] = useState(null); // { title, list, currentIdx, score, selectedIdx, showExplanation }

  // Study sheet modal state
  const [studySheetModal, setStudySheetModal] = useState(null); // { topic, lessons, sheet }

  const activeCategory =
    CURRICULUM[Math.min(activeCatIndex, CURRICULUM.length - 1)];
  const [categoryName, , topicGroups] = activeCategory;

  // Calculate total lessons and completed lessons across entire library
  const { totalLessons, completedLessons } = useMemo(() => {
    let total = 0;
    CURRICULUM.forEach((cat) => {
      cat[2].forEach((tg) => {
        total += tg[1].length;
      });
    });
    const done = Object.values(state.lib || {}).filter(Boolean).length;
    return { totalLessons: total, completedLessons: done };
  }, [state.lib]);

  const [now] = useState(() => Date.now());

  // Question bank for current category (e.g., Aptitude, English)
  const categoryBank = useMemo(() => {
    return QUESTION_BANKS.filter((q) => q[0] === categoryName);
  }, [categoryName]);

  // Daily question from bank based on current date
  const dailyQuestion = useMemo(() => {
    if (!categoryBank.length) return null;
    const dayIndex = Math.floor(now / 864e5) % categoryBank.length;
    return categoryBank[dayIndex];
  }, [categoryBank, now]);

  // Toggle lesson checkbox
  const handleLessonToggle = (catName, topicName, lessonName) => {
    const key = `${catName}|${topicName}|${lessonName}`;
    const currentVal = !!(state.lib || {})[key];
    setState((s) => ({
      ...s,
      lib: {
        ...(s.lib || {}),
        [key]: currentVal ? 0 : 1,
      },
    }));
  };

  // Open study sheet modal
  const openStudySheet = (topicName, lessons) => {
    const sheet =
      STUDY_SHEETS[topicName] || ["Notes for this topic are coming soon."];
    setStudySheetModal({
      topic: topicName,
      lessons,
      sheet,
    });
  };

  // Open video modal
  const openVideo = (topicName) => {
    setActiveModal("video");
    setModalData({ topic: topicName });
  };

  // Start practice quiz
  const startQuiz = (list, title) => {
    setActiveQuiz({
      title,
      list,
      currentIdx: 0,
      score: 0,
      selectedIdx: null,
      showExplanation: false,
    });
  };

  // Handle quiz option selection
  const handleQuizAnswer = (optionIdx) => {
    if (!activeQuiz || activeQuiz.showExplanation) return;
    const currentQ = activeQuiz.list[activeQuiz.currentIdx];
    const isCorrect = optionIdx === currentQ[3];

    setActiveQuiz((prev) => ({
      ...prev,
      selectedIdx: optionIdx,
      showExplanation: true,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  // Advance or finish quiz
  const handleNextQuizQuestion = () => {
    if (!activeQuiz) return;
    setActiveQuiz((prev) => ({
      ...prev,
      currentIdx: prev.currentIdx + 1,
      selectedIdx: null,
      showExplanation: false,
    }));
  };

  return (
    <div>
      <h1>Library</h1>
      <p className="mu">
        Every topic from the basics of DSA to core CS, aptitude, English, data
        analytics, system design and AI in practice. Open a study sheet, tick
        lessons as you finish them, and practise with the question banks.{" "}
        {completedLessons} of {totalLessons} lessons done.
      </p>

      {/* Category Navigation Pills */}
      <div className="row">
        {CURRICULUM.map((cat, i) => (
          <button
            key={cat[0]}
            className={`pill ${i === activeCatIndex ? "on" : ""}`}
            data-c={i}
            onClick={() => {
              setActiveCatIndex(i);
              setDailySelected(null);
            }}
          >
            {cat[1]} {cat[0]}
          </button>
        ))}
      </div>

      {/* Daily Question & Question Bank for categories with banks */}
      {dailyQuestion && (
        <div className="grid" style={{ marginBottom: "14px" }}>
          <div className="card">
            <h2>Daily {categoryName.toLowerCase()} question</h2>
            <p>
              <b>{dailyQuestion[1]}</b>
            </p>
            <div id="dqo">
              {dailyQuestion[2].map((option, j) => {
                const isSelected = dailySelected === j;
                const isCorrect = j === dailyQuestion[3];
                let borderColor = "";
                if (dailySelected !== null) {
                  borderColor = isCorrect
                    ? "#2ED47A"
                    : isSelected
                    ? "#FF5C7A"
                    : "";
                }

                return (
                  <button
                    key={j}
                    className="btn ghost dqb"
                    data-j={j}
                    disabled={dailySelected !== null}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      margin: "5px 0",
                      borderColor: borderColor || undefined,
                    }}
                    onClick={() => {
                      setDailySelected(j);
                      setState((s) => ({
                        ...s,
                        libDay: {
                          ...(s.libDay || {}),
                          [categoryName]: new Date().toISOString().slice(0, 10),
                        },
                      }));
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {dailySelected !== null && (
              <div id="dqe">
                <p className={dailySelected === dailyQuestion[3] ? "ok" : ""}>
                  <b>
                    {dailySelected === dailyQuestion[3]
                      ? "Correct."
                      : "Not quite."}
                  </b>{" "}
                  {dailyQuestion[4]}
                </p>
              </div>
            )}
          </div>

          <div className="card">
            <h2>{categoryName} question bank</h2>
            <p className="mu">
              {categoryBank.length} questions with explanations. You see the
              answer and the reasoning right after each one.
            </p>
            <button
              className="btn"
              id="qbank"
              onClick={() =>
                startQuiz(categoryBank, `${categoryName} question bank`)
              }
            >
              Start practice quiz
            </button>
          </div>
        </div>
      )}

      {/* Topics Grid */}
      <div className="grid lib">
        {topicGroups.map(([topicName, lessons]) => {
          const completedInTopic = lessons.filter(
            (l) => (state.lib || {})[`${categoryName}|${topicName}|${l}`]
          ).length;
          const pct = lessons.length
            ? (completedInTopic / lessons.length) * 100
            : 0;

          return (
            <div key={topicName} className="card">
              <h3>{topicName}</h3>
              <div className="bar">
                <i style={{ width: `${pct}%` }}></i>
              </div>
              <p className="mu lc">
                {completedInTopic} of {lessons.length} lessons
              </p>

              <details>
                <summary>Lessons</summary>
                {lessons.map((lesson) => {
                  const isChecked =
                    !!(state.lib || {})[
                      `${categoryName}|${topicName}|${lesson}`
                    ];
                  return (
                    <label
                      key={lesson}
                      className="tr"
                      style={{ cursor: "pointer" }}
                    >
                      <span>{lesson}</span>
                      <input
                        type="checkbox"
                        className="lk"
                        checked={isChecked}
                        onChange={() =>
                          handleLessonToggle(
                            categoryName,
                            topicName,
                            lesson
                          )
                        }
                      />
                    </label>
                  );
                })}
              </details>

              <div className="row">
                <button
                  className="btn ghost shb"
                  data-t={topicName}
                  data-c={activeCatIndex}
                  onClick={() => openStudySheet(topicName, lessons)}
                >
                  📄 Study sheet
                </button>
                <button
                  className="btn ghost vid2"
                  data-t={topicName}
                  onClick={() => openVideo(topicName)}
                >
                  🎬 Video{state.videos?.[topicName] ? " ✓" : ""}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Practice Quiz Modal */}
      {activeQuiz && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) setActiveQuiz(null);
          }}
        >
          <div className="sheet">
            <button
              className="x"
              aria-label="Close"
              onClick={() => setActiveQuiz(null)}
            >
              &times;
            </button>
            <h2>{activeQuiz.title}</h2>
            <div id="qz">
              {activeQuiz.currentIdx >= activeQuiz.list.length ? (
                <div>
                  <p className="big" style={{ fontSize: "36px" }}>
                    {activeQuiz.score} / {activeQuiz.list.length}
                  </p>
                  <p className="mu">
                    {activeQuiz.score >= activeQuiz.list.length * 0.8
                      ? "Excellent work."
                      : activeQuiz.score >= activeQuiz.list.length * 0.5
                      ? "Good. Read the explanations and try again."
                      : "Keep practising. Read the study sheet and retry."}
                  </p>
                  <button
                    className="btn"
                    id="qa"
                    onClick={() =>
                      setActiveQuiz((prev) => ({
                        ...prev,
                        currentIdx: 0,
                        score: 0,
                        selectedIdx: null,
                        showExplanation: false,
                      }))
                    }
                  >
                    Try again
                  </button>
                </div>
              ) : (
                (() => {
                  const q = activeQuiz.list[activeQuiz.currentIdx];
                  return (
                    <div>
                      <p className="mu">
                        Question {activeQuiz.currentIdx + 1} of{" "}
                        {activeQuiz.list.length}
                      </p>
                      <p>
                        <b>{q[1]}</b>
                      </p>
                      {q[2].map((option, j) => {
                        let borderColor = "";
                        if (activeQuiz.showExplanation) {
                          borderColor =
                            j === q[3]
                              ? "#2ED47A"
                              : j === activeQuiz.selectedIdx
                              ? "#FF5C7A"
                              : "";
                        }
                        return (
                          <button
                            key={j}
                            className="btn ghost qo"
                            data-j={j}
                            disabled={activeQuiz.showExplanation}
                            style={{
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              margin: "6px 0",
                              borderColor: borderColor || undefined,
                            }}
                            onClick={() => handleQuizAnswer(j)}
                          >
                            {option}
                          </button>
                        );
                      })}
                      {activeQuiz.showExplanation && (
                        <div id="qe">
                          <p
                            className={
                              activeQuiz.selectedIdx === q[3] ? "ok" : ""
                            }
                          >
                            <b>
                              {activeQuiz.selectedIdx === q[3]
                                ? "Correct."
                                : "Not quite."}
                            </b>{" "}
                            {q[4]}
                          </p>
                          <button
                            className="btn"
                            id="qn"
                            onClick={handleNextQuizQuestion}
                          >
                            {activeQuiz.currentIdx + 1 < activeQuiz.list.length
                              ? "Next"
                              : "Finish"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Study Sheet Modal */}
      {studySheetModal && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) setStudySheetModal(null);
          }}
        >
          <div className="sheet">
            <button
              className="x"
              aria-label="Close"
              onClick={() => setStudySheetModal(null)}
            >
              &times;
            </button>
            <h2>{studySheetModal.topic}: study sheet</h2>
            <p className="mu">Key points to remember.</p>
            <ul className="shl">
              {studySheetModal.sheet.map((x, idx) => (
                <li key={idx}>{x}</li>
              ))}
            </ul>
            <h3>Lessons in this topic</h3>
            <ul className="shl">
              {studySheetModal.lessons.map((lesson, idx) => (
                <li key={idx}>{lesson}</li>
              ))}
            </ul>
            <p className="mu">
              Tip: when Calibr8 is open in its own tab, your browser&apos;s print
              option can save this page as a PDF.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}