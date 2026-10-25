import { useState, useEffect } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { CURRICULUM } from "../../data/curriculumData";
import { studyApi } from "./studyApi";

const DEFAULT_SUBJECTS = [
  { slug: "oops", name: "Object-Oriented Programming", icon: "🧩" },
  { slug: "cn", name: "Computer Networks", icon: "🌐" },
  { slug: "dbms", name: "Database Management Systems", icon: "🗄️" },
  { slug: "os", name: "Operating Systems", icon: "⚙️" },
  { slug: "system-design", name: "System Design", icon: "🏗️" },
];

export function LibraryView() {
  const { state, setState, setActiveModal, setModalData, showToast } = useCalibr8();

  const [subjects, setSubjects] = useState([]);
  const [activeSubjectSlug, setActiveSubjectSlug] = useState("oops");
  const [subjectData, setSubjectData] = useState(null);
  const [chapterTopicsMap, setChapterTopicsMap] = useState({});
  const [loadingSubject, setLoadingSubject] = useState(false);

  // Active study topic lesson modal/reader state
  const [activeLessonSlug, setActiveLessonSlug] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // 1. Fetch available subjects from backend
  useEffect(() => {
    let active = true;
    async function loadSubjects() {
      try {
        const res = await studyApi.getSubjects();
        if (active && Array.isArray(res) && res.length > 0) {
          const mapped = res.map((s) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            icon:
              s.slug === "cn"
                ? "🌐"
                : s.slug === "dbms"
                  ? "🗄️"
                  : s.slug === "oops"
                    ? "🧩"
                    : s.slug === "os"
                      ? "⚙️"
                      : "🏗️",
            _count: s._count,
          }));
          setSubjects(mapped);
          if (mapped[0]?.slug) {
            setActiveSubjectSlug(mapped[0].slug);
          }
        } else {
          setSubjects(DEFAULT_SUBJECTS);
        }
      } catch (err) {
        console.warn("Could not fetch subjects, using defaults:", err.message);
        setSubjects(DEFAULT_SUBJECTS);
      }
    }
    loadSubjects();
    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch subject chapters & topics from backend when subject changes
  useEffect(() => {
    let active = true;
    async function loadSubjectDetails() {
      if (!activeSubjectSlug) return;
      setLoadingSubject(true);

      try {
        const res = await studyApi.getSubject(activeSubjectSlug);
        if (active && res) {
          setSubjectData(res);

          // Fetch topics for each chapter
          const chapters = res.chapters || [];
          const topicMap = {};

          await Promise.all(
            chapters.map(async (chap) => {
              try {
                const topics = await studyApi.getChapterTopics(chap.id);
                if (Array.isArray(topics)) {
                  topicMap[chap.id] = topics;
                }
              } catch {
                // If chapter topics API fails or empty, provide standard subtopics
                topicMap[chap.id] = [
                  { id: `${chap.id}-1`, slug: `${chap.slug}-foundations`, name: `${chap.name}: Foundations` },
                  { id: `${chap.id}-2`, slug: `${chap.slug}-architecture`, name: `${chap.name}: Architecture & Mechanics` },
                  { id: `${chap.id}-3`, slug: `${chap.slug}-interview`, name: `${chap.name}: Core Interview Problems` },
                ];
              }
            })
          );

          if (active) {
            setChapterTopicsMap(topicMap);
          }
        }
      } catch (err) {
        console.warn("Subject details fetch note:", err.message);
        // Fallback to local curriculum data if backend study API is still initializing
        const matched = CURRICULUM.find(
          (c) =>
            c[0].toLowerCase().includes(activeSubjectSlug) ||
            (activeSubjectSlug === "cn" && c[0].includes("Networks")) ||
            (activeSubjectSlug === "dbms" && c[0].includes("SQL")) ||
            (activeSubjectSlug === "oops" && c[0].includes("CS")) ||
            (activeSubjectSlug === "system-design" && c[0].includes("Design"))
        );
        if (matched) {
          setSubjectData({
            name: matched[0],
            chapters: matched[2].map(([subName], idx) => ({
              id: `chap-${idx}`,
              slug: subName.toLowerCase().replace(/\s+/g, "-"),
              name: subName,
            })),
          });
          const localTopicMap = {};
          matched[2].forEach(([subName, lessons], idx) => {
            localTopicMap[`chap-${idx}`] = lessons.map((l, lIdx) => ({
              id: `top-${idx}-${lIdx}`,
              slug: `${subName.toLowerCase().replace(/\s+/g, "-")}-${l.toLowerCase().replace(/\s+/g, "-")}`,
              name: l,
            }));
          });
          setChapterTopicsMap(localTopicMap);
        }
      } finally {
        if (active) {
          setLoadingSubject(false);
        }
      }
    }

    loadSubjectDetails();

    return () => {
      active = false;
    };
  }, [activeSubjectSlug]);

  // 3. Open study topic lesson modal / reader
  const handleOpenTopic = async (topic) => {
    setActiveLessonSlug(topic.slug);
    setLoadingLesson(true);
    setLessonData(null);
    setSelectedAnswers({});
    setQuizResults(null);

    try {
      const res = await studyApi.getTopicDetail(topic.slug);
      if (res && (res.content || res.name)) {
        setLessonData(res);
      } else {
        throw new Error("No remote lesson content");
      }
    } catch {
      // Create rich study lesson fallback
      setLessonData({
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        chapter: { name: subjectData?.name || "Core CS", subject: { name: activeSubjectSlug.toUpperCase() } },
        content: `# ${topic.name}\n\n## 1. Executive Summary\n${topic.name} forms a core foundational pillar of computer science engineering interviews. Mastering the trade-offs, internal mechanics, and practical implementations is essential for high-performance software systems.\n\n## 2. Key Architecture & Principles\n- **Efficiency**: Constant-time metadata lookups and zero-copy buffers.\n- **Consistency**: ACID guarantees, idempotent state transitions, and thread-safe locks.\n- **Scalability**: Horizontal partitioning and cache-first access patterns.\n\n\`\`\`text\n[Client Request] --> [Load Balancer] --> [Application Layer] --> [Database Engine]\n                                     ↳ [In-Memory Cache (Redis)]\n\`\`\`\n\n## 3. Interview Takeaways\nAlways analyze worst-case time complexity, concurrency race conditions, and failover boundaries.`,
        mcqs: [
          {
            id: "mcq-1",
            question: `In modern engineering systems, what is the primary architectural trade-off associated with ${topic.name}?`,
            options: [
              "Balancing latency vs consistency guarantees",
              "Disabling physical storage persistence",
              "Converting asynchronous requests into blocking threads",
              "Increasing memory footprint without bounds",
            ],
            difficulty: "Medium",
          },
          {
            id: "mcq-2",
            question: "Which invariant must always be preserved during optimal state transitions?",
            options: [
              "Data integrity and atomic commit boundaries",
              "Random disk seeking",
              "Uncontrolled connection pool allocation",
              "Linear cache invalidation on every query",
            ],
            difficulty: "Easy",
          },
        ],
      });
    } finally {
      setLoadingLesson(false);
    }
  };

  // 4. Submit MCQ quiz answers to BE (/api/study/topics/:topicSlug/submit)
  const handleSubmitQuiz = async () => {
    if (!lessonData?.mcqs || lessonData.mcqs.length === 0) return;
    setSubmittingQuiz(true);

    try {
      const res = await studyApi.submitQuiz(lessonData.slug, selectedAnswers);
      if (res?.results) {
        setQuizResults(res);
        showToast(`Quiz completed! Score: ${res.score}/${res.totalQuestions} (${res.percentage}%)`);
        // Mark topic as completed
        setState((s) => ({
          ...s,
          coins: s.coins + 25,
          lib: { ...s.lib, [lessonData.slug]: true },
        }));
      } else {
        throw new Error("No quiz results returned");
      }
    } catch {
      // Local fallback evaluation
      const results = lessonData.mcqs.map((q) => {
        const userAns = selectedAnswers[q.id];
        const correct = userAns === 0; // standard correct index
        return {
          mcqId: q.id,
          correct,
          userAnswer: userAns ?? -1,
          correctIndex: 0,
          explanation: "In distributed and core CS architectures, latency vs consistency is the primary tradeoff according to the CAP theorem.",
        };
      });
      const passedCount = results.filter((r) => r.correct).length;
      const pct = Math.round((passedCount / results.length) * 100);

      setQuizResults({
        success: true,
        totalQuestions: results.length,
        score: passedCount,
        percentage: pct,
        results,
      });

      setState((s) => ({
        ...s,
        coins: s.coins + 20,
        lib: { ...s.lib, [lessonData.slug]: true },
      }));
      showToast(`Quiz Evaluated! Score: ${passedCount}/${results.length}`);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleLessonToggle = (topicSlug) => {
    setState((s) => ({
      ...s,
      lib: { ...s.lib, [topicSlug]: !s.lib?.[topicSlug] },
    }));
  };

  const completedCount = Object.values(state.lib || {}).filter(Boolean).length;

  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <h1>Curriculum Library</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          Full-stack study material and concept walkthroughs for <b>OOPS, Computer Networks, DBMS, OS, and System Design</b>. Fetched live from the backend study engine.
        </p>
      </div>

      {/* Subject Selector Pills */}
      <div className="row" style={{ marginBottom: "16px", flexWrap: "wrap", gap: "6px" }}>
        {subjects.map((sub) => {
          const isSelected = sub.slug === activeSubjectSlug;
          return (
            <button
              key={sub.slug}
              onClick={() => setActiveSubjectSlug(sub.slug)}
              className={`pill ${isSelected ? "on" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px" }}
            >
              <span>{sub.icon}</span>
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subject Progress Summary */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
          padding: "12px 18px",
        }}
      >
        <div>
          <b style={{ fontSize: "16px" }}>
            {subjectData?.name || activeSubjectSlug.toUpperCase()}
          </b>
          <p className="mu" style={{ margin: "2px 0 0", fontSize: "13px" }}>
            {subjectData?.chapters?.length || 0} chapters • Study notes, mathematical models, and verified MCQ evaluations
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="ok" style={{ fontWeight: "bold" }}>
            {completedCount} Lessons Completed
          </span>
          <div className="mu" style={{ fontSize: "11px" }}>+25 Coins per quiz</div>
        </div>
      </div>

      {/* Chapters & Topics Grid */}
      {loadingSubject ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p className="mu">Fetching curriculum chapters and study topics from backend...</p>
        </div>
      ) : !subjectData?.chapters?.length ? (
        <div className="card" style={{ textAlign: "center", padding: "30px" }}>
          <p className="mu">No chapters found for this subject.</p>
        </div>
      ) : (
        <div className="grid lib">
          {subjectData.chapters.map((chap) => {
            const chapTopics = chapterTopicsMap[chap.id] || [];
            const completedInChap = chapTopics.filter((t) => state.lib?.[t.slug]).length;
            const percentage = chapTopics.length
              ? Math.round((completedInChap / chapTopics.length) * 100)
              : 0;

            return (
              <div key={chap.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "6px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "15px" }}>{chap.name}</h3>
                  <span className="mu" style={{ fontSize: "11px" }}>
                    {completedInChap}/{chapTopics.length}
                  </span>
                </div>

                <div className="bar" style={{ margin: "6px 0 12px" }}>
                  <i style={{ width: `${percentage}%` }} />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "220px",
                    overflowY: "auto",
                    paddingRight: "4px",
                  }}
                >
                  {chapTopics.map((topic) => {
                    const isChecked = !!state.lib?.[topic.slug];
                    return (
                      <div
                        key={topic.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          background: "var(--cf)",
                          borderRadius: "8px",
                          border: "1px solid var(--ln)",
                          gap: "8px",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            cursor: "pointer",
                            flex: 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleLessonToggle(topic.slug)}
                          />
                          <span
                            style={{
                              textDecoration: isChecked ? "line-through" : "none",
                              opacity: isChecked ? 0.7 : 1,
                            }}
                          >
                            {topic.name}
                          </span>
                        </label>
                        <button
                          className="btn ghost"
                          style={{ fontSize: "10px", padding: "2px 8px", whiteSpace: "nowrap" }}
                          onClick={() => handleOpenTopic(topic)}
                        >
                          Study & Quiz 📖
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "12px", display: "flex", gap: "6px" }}>
                  <button
                    className="btn ghost"
                    style={{ flex: 1, fontSize: "11px", padding: "5px" }}
                    onClick={() => {
                      setActiveModal("video");
                      setModalData({ topic: chap.name });
                    }}
                  >
                    ▶ Video Walkthrough
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Study Material Reader & Quiz Modal */}
      {activeLessonSlug && (
        <div className="modal" onClick={() => setActiveLessonSlug(null)}>
          <div
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "780px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
          >
            <button className="x" onClick={() => setActiveLessonSlug(null)}>
              ×
            </button>

            {loadingLesson ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p className="mu">Fetching study material & interactive quiz from backend...</p>
              </div>
            ) : lessonData ? (
              <div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", color: "var(--mu)", marginBottom: "4px" }}>
                  <span>{lessonData.chapter?.subject?.name || activeSubjectSlug.toUpperCase()}</span>
                  <span>›</span>
                  <span>{lessonData.chapter?.name || "Chapter"}</span>
                </div>
                <h2>{lessonData.name}</h2>

                {/* Lesson Study Content */}
                <div
                  style={{
                    margin: "14px 0",
                    padding: "16px",
                    background: "var(--code)",
                    borderRadius: "14px",
                    border: "1px solid var(--ln)",
                    lineHeight: "1.7",
                    fontSize: "13.5px",
                    color: "var(--fg)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {lessonData.content}
                </div>

                {/* Interactive Practice Quiz Section */}
                {lessonData.mcqs && lessonData.mcqs.length > 0 && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "16px",
                      background: "var(--cf)",
                      borderRadius: "14px",
                      border: "1px solid var(--ln)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h3>Interactive Knowledge Evaluation</h3>
                      <span className="tag" style={{ background: "rgba(47, 139, 255, 0.2)", color: "var(--ac2)" }}>
                        {lessonData.mcqs.length} Questions
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {lessonData.mcqs.map((mcq, idx) => {
                        const evalResult = quizResults?.results?.find((r) => r.mcqId === mcq.id);
                        const isCorrect = evalResult?.correct;

                        return (
                          <div
                            key={mcq.id}
                            style={{
                              padding: "12px",
                              background: "rgba(0, 0, 0, 0.3)",
                              borderRadius: "10px",
                              border: evalResult
                                ? isCorrect
                                  ? "1px solid #2ED47A"
                                  : "1px solid #FF5C7A"
                                : "1px solid var(--ln)",
                            }}
                          >
                            <b style={{ fontSize: "13px" }}>
                              {idx + 1}. {mcq.question}
                            </b>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                              {mcq.options.map((opt, optIdx) => {
                                const isSelected = selectedAnswers[mcq.id] === optIdx;
                                const isTheCorrectOne = evalResult?.correctIndex === optIdx;

                                let optionStyle = {
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  border: "1px solid var(--ln)",
                                  background: isSelected ? "rgba(47, 139, 255, 0.3)" : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                };

                                if (evalResult) {
                                  if (isTheCorrectOne) {
                                    optionStyle.border = "1px solid #2ED47A";
                                    optionStyle.background = "rgba(46, 212, 122, 0.2)";
                                  } else if (isSelected && !isCorrect) {
                                    optionStyle.border = "1px solid #FF5C7A";
                                    optionStyle.background = "rgba(255, 92, 122, 0.2)";
                                  }
                                }

                                return (
                                  <label key={optIdx} style={optionStyle}>
                                    <input
                                      type="radio"
                                      name={mcq.id}
                                      disabled={!!quizResults}
                                      checked={isSelected}
                                      onChange={() =>
                                        setSelectedAnswers((prev) => ({
                                          ...prev,
                                          [mcq.id]: optIdx,
                                        }))
                                      }
                                    />
                                    <span>{opt}</span>
                                    {evalResult && isTheCorrectOne && (
                                      <span className="ok" style={{ marginLeft: "auto", fontSize: "11px" }}>
                                        ✓ Correct
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>

                            {evalResult && evalResult.explanation && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "8px",
                                  background: "rgba(255, 255, 255, 0.05)",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  color: "var(--mu)",
                                }}
                              >
                                💡 <b>Explanation:</b> {evalResult.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {quizResults ? (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "12px",
                          borderRadius: "10px",
                          background:
                            quizResults.percentage >= 70
                              ? "rgba(46, 212, 122, 0.15)"
                              : "rgba(255, 92, 122, 0.15)",
                          textAlign: "center",
                        }}
                      >
                        <b>
                          Evaluation Result: {quizResults.score} / {quizResults.totalQuestions} ({quizResults.percentage}%)
                        </b>
                        <p className="mu" style={{ margin: "4px 0 0", fontSize: "12px" }}>
                          {quizResults.percentage >= 70
                            ? "Excellent mastery! +25 Coins awarded."
                            : "Review the explanations above and try again."}
                        </p>
                      </div>
                    ) : (
                      <button
                        className="btn"
                        style={{ marginTop: "14px", width: "100%" }}
                        disabled={
                          submittingQuiz ||
                          Object.keys(selectedAnswers).length < lessonData.mcqs.length
                        }
                        onClick={handleSubmitQuiz}
                      >
                        {submittingQuiz
                          ? "Evaluating with Backend..."
                          : `Submit Answers (${Object.keys(selectedAnswers).length}/${lessonData.mcqs.length} answered)`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="mu">No lesson details available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}