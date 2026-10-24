import { useState, useEffect } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

const TOPIC_QUIZZES = {
  "Sliding Window": [
    [
      "When the window violates the threshold constraint, what is the optimal step?",
      [
        "Restart from the first element",
        "Advance the left pointer forward",
        "Clear and re-sort the array",
      ],
      1,
    ],
    [
      "Why does a two-pointer sliding window run in O(n) linear time?",
      [
        "Each element enters and leaves the window at most once",
        "It pre-sorts the elements using quicksort",
        "It randomly samples subarray midpoints",
      ],
      0,
    ],
  ],
  default: [
    [
      "What is the core objective of this lesson?",
      [
        "Memorize code snippets verbatim",
        "Understand algorithmic intuition and invariants",
        "Skip the analysis and jump to coding",
      ],
      1,
    ],
  ],
};

export function VideoModal() {
  const {
    state,
    setState,
    activeModal,
    setActiveModal,
    modalData,
    showToast,
  } = useCalibr8();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizFeedback, setQuizFeedback] = useState("");

  const topicName = modalData?.topic || "Sliding Window";
  const duration = 60; // 1-minute demo duration

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgressSeconds((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1 * playbackSpeed;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  if (activeModal !== "video") return null;

  const close = () => {
    setIsPlaying(false);
    setActiveModal(null);
  };

  const handleTogglePlay = () => {
    if (progressSeconds >= duration) {
      setProgressSeconds(0);
    }
    setIsPlaying(!isPlaying);
  };

  const questions = TOPIC_QUIZZES[topicName] || TOPIC_QUIZZES.default;
  const isVideoCompleted = state.videos?.[topicName];
  const progressPercent = Math.min(100, Math.round((progressSeconds / duration) * 100));

  const handleCheckQuiz = () => {
    let allCorrect = true;
    questions.forEach((q, idx) => {
      if (answers[idx] !== q[2]) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      setQuizFeedback("All answers correct! +20 Coins awarded.");
      setState((s) => ({
        ...s,
        coins: s.coins + 20,
        videos: { ...s.videos, [topicName]: true },
      }));
      showToast("Concept mastered: +20 Coins!");
    } else {
      setQuizFeedback("Some answers were incorrect. Review the lesson and retry.");
    }
  };

  return (
    <div className="modal" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close}>
          ×
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h2>{topicName}: Visual Breakdown</h2>
          <span className="tag">
            {isVideoCompleted ? "Completed ✓" : "Concept Video"}
          </span>
        </div>

        {/* Video Player Display */}
        <div className="vscreen">
          <div style={{ fontSize: "40px" }}>{isPlaying ? "⏸" : "▶"}</div>
          <b>{topicName} Invariants & Walkthrough</b>
          <div className="mu" style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
            Visualizing pointer shifts, time bounds, and boundary states
          </div>
        </div>

        <div className="vbar">
          <i style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Video Controls */}
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="btn" onClick={handleTogglePlay}>
              {isPlaying ? "Pause" : progressSeconds >= duration ? "Replay" : "Play"}
            </button>
            <span className="mu" style={{ fontSize: "12px", fontFamily: "monospace" }}>
              {Math.floor(progressSeconds)}s / {duration}s
            </span>
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 1.5, 2].map((spd) => (
              <button
                key={spd}
                className={`pill ${playbackSpeed === spd ? "on" : ""}`}
                style={{ fontSize: "11px", padding: "3px 8px" }}
                onClick={() => setPlaybackSpeed(spd)}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Concept Check Quiz */}
        <h3>Concept Check</h3>
        <p className="mu" style={{ fontSize: "12px", margin: "2px 0 10px" }}>
          Answer correctly to unlock coins and mark the concept video as complete.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
          {questions.map(([qText, options, _correctIdx], qIdx) => (
            <div
              key={qIdx}
              style={{
                padding: "10px",
                background: "var(--cf)",
                borderRadius: "10px",
                border: "1px solid var(--ln)",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                {qIdx + 1}. {qText}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name={`q_${qIdx}`}
                      checked={answers[qIdx] === optIdx}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
                      }
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {quizFeedback && (
          <div
            className={quizFeedback.includes("correct") ? "ok" : "bad"}
            style={{ fontWeight: 600, fontSize: "13px", marginBottom: "10px" }}
          >
            {quizFeedback}
          </div>
        )}

        <button
          className="btn"
          style={{ width: "100%" }}
          onClick={handleCheckQuiz}
        >
          Verify Concept Answers (+20 Coins)
        </button>
      </div>
    </div>
  );
}
