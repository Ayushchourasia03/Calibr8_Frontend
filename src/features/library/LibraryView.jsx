import { useCalibr8 } from "../../context/Calibr8Context";
import { CURRICULUM } from "../../data/curriculumData";

export function LibraryView() {
  const { state, setState, setActiveModal, setModalData } = useCalibr8();

  const selectedCatIndex = state.libCat || 0;
  const [currentCategoryName, , subtopics] =
    CURRICULUM[selectedCatIndex] || CURRICULUM[0];

  const totalLessonsInCurriculum = CURRICULUM.reduce(
    (total, cat) =>
      total + cat[2].reduce((subTotal, topic) => subTotal + topic[1].length, 0),
    0,
  );

  const completedLessonsCount = Object.values(state.lib || {}).filter(
    Boolean,
  ).length;

  const handleLessonToggle = (category, topic, lesson) => {
    const key = `${category}|${topic}|${lesson}`;
    setState((s) => {
      const nextLib = { ...s.lib, [key]: !s.lib?.[key] };
      return { ...s, lib: nextLib };
    });
  };

  const handleOpenVideo = (topicName) => {
    setActiveModal("video");
    setModalData({ topic: topicName });
  };

  return (
    <div>
      <div style={{ marginBottom: "12px" }}>
        <h1>Curriculum Library</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          From DSA fundamentals to Core CS, aptitude, English, data analytics, system design and AI in practice.{" "}
          <b className="ok">
            {completedLessonsCount} of {totalLessonsInCurriculum} lessons completed
          </b>.
        </p>
      </div>

      {/* Category Pills Navigation */}
      <div className="row">
        {CURRICULUM.map(([catName, icon], idx) => {
          const isSelected = idx === selectedCatIndex;
          return (
            <button
              key={catName}
              onClick={() => setState((s) => ({ ...s, libCat: idx }))}
              className={`pill ${isSelected ? "on" : ""}`}
            >
              <span style={{ marginRight: "6px" }}>{icon}</span>
              <span>{catName}</span>
            </button>
          );
        })}
      </div>

      {/* Subtopics Grid */}
      <div className="grid lib">
        {subtopics.map(([subtopicName, lessons]) => {
          const completedInTopic = lessons.filter(
            (l) => state.lib?.[`${currentCategoryName}|${subtopicName}|${l}`],
          ).length;
          const percentage = Math.round(
            (completedInTopic / lessons.length) * 100,
          );

          return (
            <div key={subtopicName} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0 }}>{subtopicName}</h3>
                <span className="mu" style={{ fontSize: "12px" }}>
                  {completedInTopic} / {lessons.length}
                </span>
              </div>

              <div className="bar" style={{ margin: "8px 0 12px" }}>
                <i style={{ width: `${percentage}%` }} />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  maxHeight: "180px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {lessons.map((lesson) => {
                  const isChecked =
                    !!state.lib?.[`${currentCategoryName}|${subtopicName}|${lesson}`];
                  return (
                    <label
                      key={lesson}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          handleLessonToggle(
                            currentCategoryName,
                            subtopicName,
                            lesson,
                          )
                        }
                      />
                      <span
                        style={{
                          textDecoration: isChecked ? "line-through" : "none",
                          opacity: isChecked ? 0.7 : 1,
                        }}
                      >
                        {lesson}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  className="btn ghost"
                  style={{ width: "100%", fontSize: "12px", padding: "6px" }}
                  onClick={() => handleOpenVideo(subtopicName)}
                >
                  ▶ Video Walkthrough
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}