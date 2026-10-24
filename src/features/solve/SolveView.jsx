import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { MonacoEditor } from "./MonacoEditor";
import { LANGS, DIFFICULTY_LABELS } from "../../data/constants";

export function SolveView() {
  const {
    currentQ,
    state,
    setState,
    setActiveModal,
    setModalData,
    getTopicRating,
    analyzeCode,
    showToast,
  } = useCalibr8();

  const [selectedLang, setSelectedLang] = useState(state.lang || "Python3");
  const [showDryRun, setShowDryRun] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("O(n)");
  const [quizResult, setQuizResult] = useState(null);
  const [resultData, setResultData] = useState(null);

  const attempt = state.att;
  const isStrict = attempt?.mode === "strict";
  const isLocked = attempt?.locked;

  const startMode = (mode) => {
    setState((s) => ({
      ...s,
      att: {
        mode,
        code: "",
        hints: 0,
        locked: false,
        away: 0,
        active: true,
      },
    }));

    if (mode === "strict") {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  const handleAbandon = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setState((s) => ({ ...s, att: null }));
    setShowDryRun(false);
    setResultData(null);
  };

  const handleDryRun = () => {
    if (state.freeDry > 0) {
      setState((s) => ({ ...s, freeDry: s.freeDry - 1 }));
      setShowDryRun(true);
    } else if (state.coins >= 20) {
      setState((s) => ({ ...s, coins: s.coins - 20 }));
      setShowDryRun(true);
    } else {
      showToast("Not enough coins for dry run (20 needed).");
    }
  };

  const handleUnlock = () => {
    if (state.coins < 500) {
      showToast("Unlocking requires 500 coins.");
      return;
    }
    setState((s) => ({
      ...s,
      coins: s.coins - 500,
      att: { ...s.att, locked: false, away: 0 },
    }));
    showToast("Question unlocked!");
  };

  const handleSubmit = () => {
    const code = (attempt?.code || "").trim();
    if (code.length < 10) {
      showToast("Please write a complete solution before submitting.");
      return;
    }

    // Static code analysis
    let an;
    try {
      an = analyzeCode(code, selectedLang);
    } catch {
      an = null;
    }

    let t;
    let sm = 1;
    let bonus = 0;

    if (an) {
      const ct = an.exp ? 100 : an.time[0] * 10 + an.time[1];
      const targetTime = 10;
      const g = ct - targetTime;
      const sg = an.space - 1;
      const sus = g < -10;
      t = !an.ok ? 0 : sus ? 1 : g <= 0 ? 3 : g <= 5 ? 2 : 1;
      sm = sg <= 0 ? 1 : sg <= 0.5 ? 0.95 : sg <= 1 ? 0.9 : 0.8;
      bonus = t === 3 && sg <= 0 ? 10 : 0;
    } else {
      const c = code.toLowerCase();
      t =
        code.length < 25
          ? 0
          : /deque|monotonic/.test(c)
            ? 3
            : /sort|set|heap|map/.test(c)
              ? 2
              : 1;
    }

    const share = [0, 0.3, 0.65, 1][t];
    const mult = attempt.mode === "strict" ? 1.5 : 1.0;
    const pen =
      attempt.mode === "strict"
        ? 0
        : [0, 0.05, 0.15, 0.35][attempt.hints || 0];

    const awardedPts = Math.max(
      0,
      Math.round((currentQ.pts * share * sm * mult - pen * currentQ.pts) * 10) /
        10,
    );
    const prevBest = state.best?.[currentQ.key] || 0;
    const delta = Math.max(0, Math.round((awardedPts - prevBest) * 10) / 10);
    const earnedCoins = Math.round(delta * 2) + (delta > 0 ? bonus : 0);

    // Rating adjustment
    const r0 = getTopicRating(currentQ.topic);
    const expected = 1 / (1 + Math.pow(10, (currentQ.d - r0) / 400));
    const scoreVal = [0, 0.4, 0.7, 1.0][t];
    const K = (state.solves || 0) < 10 ? 60 : 32;
    const nextRating = Math.round(r0 + K * (scoreVal - expected));

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    setState((s) => {
      const nextSolves = (s.solves || 0) + 1;
      const nextScore = s.score + Math.round(delta * 10);
      const isCalibrated =
        s.calibrating && nextSolves >= 10 && nextScore >= 1500;

      return {
        ...s,
        coins: s.coins + earnedCoins,
        score: nextScore,
        solves: nextSolves,
        calibrating: isCalibrated ? false : s.calibrating,
        freeDry: isCalibrated ? s.freeDry + 3 : s.freeDry,
        ratings: { ...s.ratings, [currentQ.topic]: nextRating },
        best: { ...s.best, [currentQ.key]: Math.max(prevBest, awardedPts) },
        dailyDone: !currentQ.stretch ? true : s.dailyDone,
        stretchN: currentQ.stretch ? (s.stretchN || 0) + 1 : s.stretchN,
        att: null,
      };
    });

    setResultData({
      tier: t,
      pts: delta,
      coins: earnedCoins,
      mode: attempt.mode,
      analysis: an,
      bonus,
    });
  };

  const handleQuizSubmit = () => {
    if (quizAnswer === "O(n)") {
      setQuizResult({
        correct: true,
        text: "Correct! The sliding window solution runs in linear O(n) time.",
      });
      setState((s) => ({ ...s, coins: s.coins + 15 }));
    } else {
      setQuizResult({
        correct: false,
        text: "Not optimal. A two-pointer sliding window achieves O(n).",
      });
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h1>{currentQ.title}</h1>
            <span className={`dc d${["E", "M", "H"][currentQ.difficulty || 0]}`}>
              {DIFFICULTY_LABELS[currentQ.difficulty || 0]}
            </span>
          </div>
          <div className="mu" style={{ marginTop: "4px" }}>
            Topic: <b>{currentQ.topic}</b> • {currentQ.pts} Base Pts • Expected Time: {currentQ.expTime || "O(n)"}
            {state.videos?.[currentQ.topic] ? (
              <span className="ok" style={{ marginLeft: "10px" }}>✓ Concept Video Watched</span>
            ) : (
              <button
                className="btn ghost"
                style={{ marginLeft: "10px", padding: "2px 8px", fontSize: "11px" }}
                onClick={() => {
                  setActiveModal("video");
                  setModalData({ topic: currentQ.topic });
                }}
              >
                🎬 Concept Video
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className="btn ghost"
            style={{ fontSize: "12px" }}
            onClick={() => setShowNotes(!showNotes)}
          >
            📝 {showNotes ? "Hide Notes" : "Private Notes"}
          </button>
          {attempt && (
            <button
              className="btn ghost"
              style={{ fontSize: "12px", color: "var(--bad)", borderColor: "var(--bad)" }}
              onClick={handleAbandon}
            >
              Abandon Attempt
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Problem Statement + Coding Arena */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", alignItems: "start" }}>
        {/* Left Card: Problem Statement & Hints */}
        <div className="card">
          <h2>Problem Statement</h2>
          <p style={{ margin: "8px 0 14px", lineHeight: "1.6" }}>
            {currentQ.text}
          </p>

          <div style={{ padding: "10px", background: "var(--cf)", borderRadius: "8px", border: "1px solid var(--ln)", marginBottom: "14px", fontFamily: "monospace", fontSize: "13px" }}>
            <div className="mu" style={{ marginBottom: "4px" }}>Example:</div>
            <div>{currentQ.ex}</div>
          </div>

          <div className="mu" style={{ fontSize: "13px", marginBottom: "14px" }}>
            Target: <b>{currentQ.expTime || "O(n)"}</b> time, <b>{currentQ.expSpace || "O(1)"}</b> space.
          </div>

          {/* Mode Selector when not yet started */}
          {!attempt ? (
            <div style={{ padding: "14px", background: "var(--cf)", borderRadius: "14px", border: "1px solid var(--ln)", textAlign: "center" }}>
              <h3>Select Practice Mode</h3>
              <p className="mu" style={{ fontSize: "13px", margin: "6px 0 14px" }}>
                Choose between verified fullscreen practice or flexible learning.
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  className="btn"
                  onClick={() => startMode("strict")}
                >
                  Strict Mode (1.5× Pts, Fullscreen) 🔥
                </button>
                <button
                  className="btn ghost"
                  onClick={() => startMode("normal")}
                >
                  Standard Practice Mode
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Hints dropdown */}
              {!isStrict && currentQ.hints && currentQ.hints.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <h3>Hints & Guidance</h3>
                  {currentQ.hints.map((hint, idx) => (
                    <details
                      key={idx}
                      style={{
                        padding: "8px",
                        background: "var(--cf)",
                        borderRadius: "8px",
                        marginBottom: "6px",
                        border: "1px solid var(--ln)",
                      }}
                      onToggle={(e) => {
                        if (e.target.open) {
                          setState((s) => ({
                            ...s,
                            att: {
                              ...s.att,
                              hints: Math.max(s.att?.hints || 0, idx + 1),
                            },
                          }));
                        }
                      }}
                    >
                      <summary style={{ fontWeight: 600, fontSize: "13px" }}>
                        Hint {idx + 1}
                      </summary>
                      <div className="mu" style={{ marginTop: "6px", fontSize: "13px" }}>
                        {hint}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Card: Monaco Coding Arena */}
        <div className="card">
          {isStrict && (
            <div className="banner" style={{ borderLeft: "3px solid var(--bad)", marginBottom: "10px" }}>
              <b>Strict Mode Active:</b> Fullscreen enabled. Tab switching or pasting will flag the attempt.
            </div>
          )}

          {isLocked ? (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <h2 className="bad">Attempt Locked</h2>
              <p className="mu">
                You navigated away during strict mode. Question locked.
              </p>
              <button className="btn" onClick={handleUnlock}>
                Unlock Question (500 Coins)
              </button>
            </div>
          ) : (
            <div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                <select
                  value={selectedLang}
                  onChange={(e) => {
                    setSelectedLang(e.target.value);
                    setState((s) => ({ ...s, lang: e.target.value }));
                  }}
                  disabled={!attempt}
                >
                  {LANGS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn ghost"
                    disabled={!attempt}
                    onClick={handleDryRun}
                  >
                    Dry Run ({state.freeDry > 0 ? `${state.freeDry} free` : "20 coins"})
                  </button>
                  <button
                    className="btn"
                    disabled={!attempt}
                    onClick={handleSubmit}
                  >
                    Submit Code →
                  </button>
                </div>
              </div>

              {/* Monaco Editor Mount */}
              <MonacoEditor
                language={selectedLang}
                value={attempt ? attempt.code : "# Click 'Start Practice' to begin coding\n"}
                onChange={(val) => {
                  if (attempt) {
                    setState((s) => ({
                      ...s,
                      att: { ...s.att, code: val },
                    }));
                  }
                }}
                readOnly={!attempt}
                isStrictMode={isStrict}
                onPasteBlocked={() => {
                  showToast("Pasting is disabled in Strict Mode!");
                }}
              />

              {/* Dry Run Test Case Output */}
              {showDryRun && (
                <div style={{ marginTop: "14px", padding: "12px", background: "var(--cf)", borderRadius: "10px", border: "1px solid var(--ln)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <b>Dry Run Test Results</b>
                    <span className="ok">✓ All Test Cases Passed (Mock Engine)</span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Test Case</th>
                        <th>Input</th>
                        <th>Expected</th>
                        <th>Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Case 1</td>
                        <td>[2, 7, 11, 15], 9</td>
                        <td>[0, 1]</td>
                        <td className="ok">[0, 1]</td>
                      </tr>
                      <tr>
                        <td>Case 2</td>
                        <td>[3, 2, 4], 6</td>
                        <td>[1, 2]</td>
                        <td className="ok">[1, 2]</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Submission Result Banner */}
          {resultData && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                borderRadius: "12px",
                background: resultData.tier > 0 ? "rgba(46, 212, 122, 0.15)" : "rgba(255, 92, 122, 0.15)",
                border: `1px solid ${resultData.tier > 0 ? "#2ED47A" : "#FF5C7A"}`,
              }}
            >
              <h3>
                {resultData.tier === 3
                  ? "🎉 Optimal Solution Accepted!"
                  : resultData.tier === 2
                    ? "✓ Solution Accepted (Sub-optimal Complexity)"
                    : resultData.tier === 1
                      ? "⚠️ Solution Passed with High Complexity"
                      : "❌ Incomplete or Syntax Error"}
              </h3>
              <p className="mu" style={{ margin: "6px 0 10px" }}>
                Awarded: <b>+{resultData.pts} Pts</b> • Earned: <b>+{resultData.coins} Coins</b>
                {resultData.bonus > 0 && " (Includes 10 coin optimal bonus!)"}
              </p>
              {resultData.analysis && (
                <div style={{ fontSize: "12px" }}>
                  Analyzed Complexity: Time {resultData.analysis.time[0] === 1 ? "O(n)" : resultData.analysis.time[0] === 2 ? "O(n²)" : "O(1)"} • Space {resultData.analysis.space === 1 ? "O(1)" : "O(n)"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Complexity Quiz Card */}
      <div className="card" style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Complexity Prediction Quiz</h2>
          <span className="tag">+15 Coins</span>
        </div>
        <p className="mu" style={{ margin: "4px 0 10px" }}>
          What is the tightest time complexity achievable for this problem?
        </p>

        <div className="row">
          <select
            value={quizAnswer}
            onChange={(e) => setQuizAnswer(e.target.value)}
          >
            <option value="O(1)">O(1) Constant</option>
            <option value="O(log n)">O(log n) Logarithmic</option>
            <option value="O(n)">O(n) Linear</option>
            <option value="O(n log n)">O(n log n) Linearithmic</option>
            <option value="O(n²)">O(n²) Quadratic</option>
          </select>
          <button className="btn" onClick={handleQuizSubmit}>
            Check Answer
          </button>
          {quizResult && (
            <span
              className={quizResult.correct ? "ok" : "bad"}
              style={{ fontWeight: 600, fontSize: "13px" }}
            >
              {quizResult.text}
            </span>
          )}
        </div>
      </div>

      {/* Private Notes Drawer */}
      {showNotes && (
        <div className="card ndrawer">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3>Private Notes</h3>
            <button
              className="x"
              style={{ position: "static", width: "26px", height: "26px", fontSize: "16px" }}
              onClick={() => setShowNotes(false)}
            >
              ×
            </button>
          </div>
          <p className="mu" style={{ fontSize: "12px", margin: "2px 0 8px" }}>
            Notes are auto-saved locally for this problem.
          </p>
          <textarea
            value={state.notes?.[currentQ.key] || ""}
            placeholder="Write your approach, edge cases, recurrence relations..."
            style={{ minHeight: "140px" }}
            onChange={(e) => {
              const val = e.target.value;
              setState((s) => ({
                ...s,
                notes: { ...s.notes, [currentQ.key]: val },
              }));
            }}
          />
        </div>
      )}
    </div>
  );
}