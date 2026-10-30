import { useEffect, useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { MonacoEditor } from "./MonacoEditor";
import { executionApi } from "./executionApi";
import { DIFFICULTY_LABELS } from "../../data/constants";

const canonicalLanguage = (language) => {
  const normalized = String(language || "").trim().toLowerCase();
  if (["python", "python3", "python 3"].includes(normalized)) return "python";
  if (["javascript", "js", "node.js"].includes(normalized)) return "javascript";
  if (["c++", "cpp"].includes(normalized)) return "cpp";
  if (normalized === "c") return "c";
  if (normalized === "java") return "java";
  return normalized;
};

export function SolveView() {
  const {
    currentQ,
    state,
    setState,
    setActiveModal,
    setModalData,
    analyzeCode,
    showToast,
    runCode,
    submitCode,
    api,
  } = useCalibr8();

  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [languageLoadError, setLanguageLoadError] = useState("");
  const [selectedLang, setSelectedLang] = useState(
    canonicalLanguage(state.lang || "python"),
  );
  const [executionMode, setExecutionMode] = useState(null);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionResults, setExecutionResults] = useState(null);
  const [executionError, setExecutionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("O(n)");
  const [quizResult, setQuizResult] = useState(null);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    let active = true;
    executionApi
      .getLanguages()
      .then((response) => {
        if (!Array.isArray(response?.languages) || response.languages.length === 0) {
          throw new Error("The execution API returned no supported languages.");
        }
        if (active) {
          setSupportedLanguages(response.languages);
          setLanguageLoadError("");
          setSelectedLang((currentLanguage) => {
            const availableLanguages = new Set(
              response.languages.map((language) => language.key),
            );
            if (availableLanguages.has(currentLanguage)) return currentLanguage;
            return response.languages[0].key;
          });
        }
      })
      .catch((error) => {
        if (active) {
          setLanguageLoadError(
            error.message || "Unable to load supported languages.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

function getStarterTemplate(q, lang) {
  const norm = (lang || "python").toLowerCase();
  if (q?.templates) {
    if (norm.includes("py") && q.templates.python) return q.templates.python;
    if ((norm.includes("js") || norm.includes("javascript")) && q.templates.javascript) return q.templates.javascript;
    if ((norm.includes("c++") || norm.includes("cpp")) && q.templates.cpp) return q.templates.cpp;
    if (norm.includes("java") && q.templates.java) return q.templates.java;
    if (norm === "c" && q.templates.c) return q.templates.c;
  }
  if (norm.includes("py")) {
    return "class Solution:\n    def solve(self):\n        # Write your code here\n        pass\n";
  }
  if (norm.includes("js") || norm.includes("ts")) {
    return "class Solution {\n    solve() {\n        // Write your code here\n    }\n}\n";
  }
  if (norm.includes("c++") || norm.includes("cpp")) {
    return "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};\n";
  }
  if (norm.includes("java")) {
    return "class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}\n";
  }
  return "// Write your solution here\n";
}

  const attempt = state.att;
  const isStrict = attempt?.mode === "strict";
  const isLocked = attempt?.locked;

  const startMode = (mode) => {
    const starter = getStarterTemplate(currentQ, selectedLang);
    setState((s) => ({
      ...s,
      att: {
        mode,
        code: starter,
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

  const handleLanguageChange = (newLang) => {
    const prevStarter = getStarterTemplate(currentQ, selectedLang);
    setSelectedLang(newLang);
    setState((s) => {
      let nextCode = s.att?.code;
      if (!nextCode || nextCode.trim() === prevStarter.trim() || nextCode.trim() === "") {
        nextCode = getStarterTemplate(currentQ, newLang);
      }
      return {
        ...s,
        lang: newLang,
        att: s.att ? { ...s.att, code: nextCode } : null,
      };
    });
  };

  const handleAbandon = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setState((s) => ({ ...s, att: null }));
    setResultData(null);
    setExecutionResults(null);
    setExecutionError("");
  };

  const handleRun = async () => {
    const code = (attempt?.code || "").trim();
    if (!code) {
      showToast("Write a solution before running it.");
      return;
    }

    setExecutionMode("run");
    setExecutionLoading(true);
    setExecutionResults(null);
    setExecutionError("");

    const slug = currentQ.slug || currentQ.key;

    try {
      const res = await runCode({
        slug,
        problemId: currentQ.id || currentQ.key,
        language: selectedLang,
        code,
      });

      setExecutionResults(res);
    } catch (err) {
      setExecutionError(err.message || "Unable to run the sample test cases.");
    } finally {
      setExecutionLoading(false);
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

  const handleSubmit = async () => {
    const code = (attempt?.code || "").trim();
    if (code.length < 10) {
      showToast("Please write a complete solution before submitting.");
      return;
    }

    setExecutionMode("submit");
    setExecutionLoading(true);
    setExecutionResults(null);
    setExecutionError("");
    setSubmitting(true);
    let sandboxResult;

    try {
      sandboxResult = await submitCode({
        slug: currentQ.slug || currentQ.key,
        problemId: currentQ.id || currentQ.key,
        language: selectedLang,
        code,
      });
      setExecutionResults({
        ...sandboxResult,
        cases: sandboxResult?.cases || sandboxResult?.results || [],
        passedCount:
          sandboxResult?.passedCount ?? sandboxResult?.passed ?? 0,
        totalCount:
          sandboxResult?.totalCount ?? sandboxResult?.total ?? 0,
      });
    } catch (err) {
      setExecutionError(err.message || "Unable to submit this solution.");
      return;
    } finally {
      setSubmitting(false);
      setExecutionLoading(false);
    }

    const fullyAccepted =
      String(sandboxResult?.status || sandboxResult?.verdict).toUpperCase() ===
        "ACCEPTED" &&
      (sandboxResult?.totalCount ?? sandboxResult?.total ?? 0) > 0 &&
      (sandboxResult?.passedCount ?? sandboxResult?.passed ?? 0) ===
        (sandboxResult?.totalCount ?? sandboxResult?.total ?? 0);

    if (!fullyAccepted) {
      setResultData(null);
      return;
    }

    // Static code analysis
    let an;
    try {
      an = analyzeCode(code, selectedLang);
    } catch {
      an = null;
    }

    const reward = sandboxResult?.reward;
    if (!reward?.stats) {
      setExecutionError(
        sandboxResult?.rewardError
          ? "Your solution was accepted, but rewards could not be saved. Refresh your profile stats and try again later."
          : "Your solution was accepted, but the server did not return updated reward stats.",
      );
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    setState((s) => {
      return {
        ...s,
        headerStats: reward.stats,
        coins: reward.stats.coins,
        score: reward.stats.scoreUnits,
        rating: reward.stats.rating,
        streak: reward.stats.streak,
        solves: reward.awarded ? (s.solves || 0) + 1 : s.solves,
        best: {
          ...s.best,
          [currentQ.key]: Math.max(
            s.best?.[currentQ.key] || 0,
            reward.points || 0,
          ),
        },
        dailyDone: !currentQ.stretch ? true : s.dailyDone,
        stretchN: currentQ.stretch ? (s.stretchN || 0) + 1 : s.stretchN,
        att: null,
      };
    });

    setResultData({
      tier: 3,
      pts: reward.points,
      coins: reward.coinsEarned,
      mode: attempt.mode,
      analysis: an,
      bonus: reward.awarded ? 10 : 0,
      awarded: reward.awarded,
      sandbox: sandboxResult,
    });
  };

  const visibleTestcases = (currentQ.testcases || []).filter(
    (testcase) => testcase.isVisible !== false,
  );

  const handleQuizSubmit = async () => {
    if (currentQ.slug) {
      try {
        await api.study.submitQuiz(currentQ.slug, {
          quiz_1: quizAnswer === "O(n)" ? 1 : 0,
        });
      } catch {
        // Fallback to local evaluation
      }
    }

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

          {visibleTestcases.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <h3 style={{ marginBottom: "8px" }}>Sample Test Cases</h3>
              <div style={{ display: "grid", gap: "8px" }}>
                {visibleTestcases.map((testcase, index) => (
                  <div
                    key={testcase.testIndex ?? index}
                    style={{
                      padding: "10px",
                      background: "var(--cf)",
                      border: "1px solid var(--ln)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <b>Sample {index + 1}</b>
                    <div className="mu" style={{ marginTop: "6px" }}>Input</div>
                    <pre style={{ margin: "3px 0 8px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {testcase.input ?? testcase.stdinSmall ?? ""}
                    </pre>
                    <div className="mu">Expected output</div>
                    <pre style={{ margin: "3px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {testcase.output ?? testcase.expectedSmall ?? ""}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={!attempt || supportedLanguages.length === 0}
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.key} value={lang.key}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                {languageLoadError && (
                  <span className="bad" role="alert">{languageLoadError}</span>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn ghost"
                    disabled={!attempt || executionLoading || supportedLanguages.length === 0}
                    onClick={handleRun}
                  >
                    {executionLoading && executionMode === "run"
                      ? "Running..."
                      : "Run"}
                  </button>
                  <button
                    className="btn"
                    disabled={!attempt || executionLoading || supportedLanguages.length === 0}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>

              {/* Monaco Editor Mount */}
              <MonacoEditor
                language={selectedLang}
                value={attempt ? attempt.code : getStarterTemplate(currentQ, selectedLang)}
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
                onRun={handleRun}
                onSubmit={handleSubmit}
              />

              {executionLoading && (
                <div className="banner" role="status" style={{ marginTop: "14px" }}>
                  {executionMode === "submit"
                    ? "Evaluating your solution against all test cases..."
                    : "Running against visible sample test cases..."}
                </div>
              )}
              {executionError && (
                <div
                  className="banner bad"
                  role="alert"
                  style={{ marginTop: "14px", borderLeft: "3px solid var(--bad)" }}
                >
                  {executionError}
                </div>
              )}
              {executionResults && !executionLoading && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px",
                    background: "var(--cf)",
                    borderRadius: "10px",
                    border: "1px solid var(--ln)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <b>{executionMode === "submit" ? "Submission Results" : "Run Results"}</b>
                    <span
                      className={
                        executionResults.totalCount > 0 &&
                        executionResults.passedCount === executionResults.totalCount
                          ? "ok"
                          : "bad"
                      }
                    >
                      {executionResults.status || executionResults.verdict || "Completed"}
                      {" · "}
                      {executionResults.passedCount ?? 0} passed ·{" "}
                      {executionResults.cases?.length ?? 0} run
                      {executionResults.totalCount > (executionResults.cases?.length ?? 0) &&
                        ` (${executionResults.totalCount} total)`}
                    </span>
                  </div>
                  {executionResults.cases?.length ? (
                    <div style={{ display: "grid", gap: "8px" }}>
                      {executionResults.cases.map((testcase, index) => {
                        const passed =
                          testcase.passed ??
                          String(testcase.status).toLowerCase() === "accepted";
                        const isHidden =
                          executionMode === "submit" && testcase.isVisible === false;

                        return (
                          <div
                            key={testcase.testIndex ?? index}
                            style={{
                              padding: "10px",
                              borderRadius: "8px",
                              border: `1px solid ${passed ? "rgba(46, 212, 122, 0.45)" : "rgba(255, 92, 122, 0.45)"}`,
                              background: passed ? "rgba(46, 212, 122, 0.08)" : "rgba(255, 92, 122, 0.08)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                              <b>Test Case {index + 1}</b>
                              <strong className={passed ? "ok" : "bad"}>
                                {passed ? "Passed" : testcase.status || "Failed"}
                              </strong>
                            </div>
                            {isHidden ? (
                              <div className="mu" style={{ marginTop: "6px" }}>
                                Hidden test case details are not shown.
                              </div>
                            ) : (
                              <div style={{ display: "grid", gap: "6px", marginTop: "8px", fontSize: "12px" }}>
                                <div>
                                  <div className="mu">Input</div>
                                  <pre style={{ margin: "3px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                    {testcase.input ?? ""}
                                  </pre>
                                </div>
                                <div>
                                  <div className="mu">Expected</div>
                                  <pre style={{ margin: "3px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                    {testcase.expected ?? ""}
                                  </pre>
                                </div>
                                <div>
                                  <div className="mu">Actual</div>
                                  <pre style={{ margin: "3px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                    {testcase.actual ?? ""}
                                  </pre>
                                </div>
                                {testcase.errorText && (
                                  <div className="bad">{testcase.errorText}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mu" role="status">
                      No testcase details were returned for this submission.
                    </p>
                  )}
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
              {!resultData.awarded && (
                <p className="mu" style={{ margin: "6px 0 10px" }}>
                  Rewards for this problem were already claimed.
                </p>
              )}
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