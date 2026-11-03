import { useEffect, useState, useRef, useCallback } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { MonacoEditor } from "./MonacoEditor";
import {
  executionApi,
  formatRuntime,
  formatMemory,
  getStatusDisplay,
  pollSubmissionWithComplexity,
  saveActiveSubmission,
  getActiveSubmission,
  clearActiveSubmission,
  ComplexityStatus,
} from "./executionApi";
import { DIFFICULTY_LABELS } from "../../data/constants";
import { Skeleton } from "../../components/common/Skeleton";

const canonicalLanguage = (language) => {
  const normalized = String(language || "")
    .trim()
    .toLowerCase();
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
    setCurrentQ,
    state,
    setState,
    setActiveModal,
    setModalData,
    showToast,
    api,
  } = useCalibr8();

  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [languageLoadError, setLanguageLoadError] = useState("");
  const [selectedLang, setSelectedLang] = useState(
    canonicalLanguage(state.lang || "python"),
  );

  // Execution & Polling State
  const [executionMode, setExecutionMode] = useState(null); // "run" | "submit"
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionStage, setExecutionStage] = useState("");
  const [executionResults, setExecutionResults] = useState(null);
  const [executionError, setExecutionError] = useState("");
  const [activeCodeSnapshot, setActiveCodeSnapshot] = useState("");
  const [recovering, setRecovering] = useState(false);

  // Complexity UI controls
  const [complexityCollapsed, setComplexityCollapsed] = useState(false);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);

  // Miscellaneous panel states
  const [showNotes, setShowNotes] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("O(n)");
  const [quizResult, setQuizResult] = useState(null);

  // Abort controller ref to cancel in-flight polling on unmount or question switch
  const pollingAbortRef = useRef(null);

  const problemKey = currentQ?.slug || currentQ?.key || currentQ?.id;

  useEffect(() => {
    if (currentQ?.description && Array.isArray(currentQ?.testcases)) return;

    const lookupKey =
      currentQ?.slug ||
      currentQ?.problemNumber ||
      currentQ?.id ||
      currentQ?.key;
    if (!lookupKey) return;

    let active = true;
    api.problems
      .getBySlug(lookupKey)
      .then((response) => {
        if (!active || !response?.data) return;
        setCurrentQ((problem) => {
          if (
            !problem ||
            (problem.slug ||
              problem.problemNumber ||
              problem.id ||
              problem.key) !== lookupKey
          ) {
            return problem;
          }
          return { ...problem, ...response.data };
        });
      })
      .catch((error) => {
        if (active) {
          showToast(error.message || "Unable to load problem details.");
        }
      });

    return () => {
      active = false;
    };
  }, [api.problems, currentQ, setCurrentQ, showToast]);

  // 1. Fetch supported languages on mount
  useEffect(() => {
    let active = true;
    executionApi
      .getLanguages()
      .then((response) => {
        if (
          !Array.isArray(response?.languages) ||
          response.languages.length === 0
        ) {
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

  // 2. Submission Recovery on mount / problem switch (PRD Section 10)
  useEffect(() => {
    if (!problemKey) return;

    const savedSub = getActiveSubmission(problemKey);
    if (!savedSub?.id) return;

    let isMounted = true;
    const abortController = new AbortController();
    pollingAbortRef.current = abortController;

    // Asynchronously begin recovery without triggering synchronous effect setState
    Promise.resolve().then(() => {
      if (!isMounted) return;
      setRecovering(true);
      setExecutionLoading(true);
      setExecutionMode(savedSub.mode || "submit");
      setExecutionStage("Recovering active submission...");
      setExecutionError("");

      pollSubmissionWithComplexity(savedSub.id, {
        signal: abortController.signal,
        onExecutionProgress: (sub) => {
          if (!isMounted) return;
          setExecutionStage(getStatusDisplay(sub.status));
          setExecutionResults(sub);
        },
        onExecutionComplete: (sub) => {
          if (!isMounted) return;
          setExecutionResults(sub);
          clearActiveSubmission(problemKey);
        },
        onComplexityUpdate: (complexity) => {
          if (!isMounted) return;
          setExecutionResults((prev) =>
            prev ? { ...prev, complexity } : prev,
          );
        },
      })
        .then((finalSub) => {
          if (!isMounted) return;
          setExecutionResults(finalSub);
          clearActiveSubmission(problemKey);
        })
        .catch((err) => {
          if (isMounted && !abortController.signal.aborted) {
            setExecutionError(
              err.message || "Failed to recover submission status.",
            );
            clearActiveSubmission(problemKey);
          }
        })
        .finally(() => {
          if (isMounted && !abortController.signal.aborted) {
            setExecutionLoading(false);
            setRecovering(false);
          }
        });
    });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [problemKey]);

  function getStarterTemplate(q, lang) {
    const norm = (lang || "python").toLowerCase();
    if (q?.templates) {
      if (norm.includes("py") && q.templates.python) return q.templates.python;
      if (
        (norm.includes("js") || norm.includes("javascript")) &&
        q.templates.javascript
      )
        return q.templates.javascript;
      if ((norm.includes("c++") || norm.includes("cpp")) && q.templates.cpp)
        return q.templates.cpp;
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
      if (
        !nextCode ||
        nextCode.trim() === prevStarter.trim() ||
        nextCode.trim() === ""
      ) {
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
    if (pollingAbortRef.current) {
      pollingAbortRef.current.abort();
    }
    clearActiveSubmission(problemKey);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setState((s) => ({ ...s, att: null }));
    setExecutionResults(null);
    setExecutionError("");
    setExecutionLoading(false);
  };

  // 3. Run Handler (PRD Section 3.1 & 5.1)
  const handleRun = useCallback(async () => {
    if (executionLoading) return; // Prevent duplicate execution requests

    const code = (attempt?.code || "").trim();
    if (!code) {
      showToast("Write a solution before running it.");
      return;
    }

    // Preserve code snapshot associated with this execution
    setActiveCodeSnapshot(code);
    setExecutionMode("run");
    setExecutionLoading(true);
    setExecutionStage("Waiting in queue");
    setExecutionResults(null);
    setExecutionError("");

    const abortController = new AbortController();
    pollingAbortRef.current = abortController;

    try {
      const res = await executionApi.run({
        slug: currentQ.slug || currentQ.key,
        problemId: currentQ.id || currentQ.key,
        language: selectedLang,
        code,
        wait: true,
      });

      // If backend returned immediate terminal result
      if (res?.isTerminal) {
        setExecutionResults(res);
        setExecutionLoading(false);
        return;
      }

      // If queued/processing, poll status
      if (res?.id) {
        setExecutionStage(getStatusDisplay(res.status));
        const finalRes = await pollSubmissionWithComplexity(res.id, {
          signal: abortController.signal,
          onExecutionProgress: (sub) => {
            setExecutionStage(getStatusDisplay(sub.status));
            setExecutionResults(sub);
          },
          onExecutionComplete: (sub) => {
            setExecutionResults(sub);
          },
          onComplexityUpdate: (complexity) => {
            setExecutionResults((prev) =>
              prev ? { ...prev, complexity } : prev,
            );
          },
        });
        setExecutionResults(finalRes);
      } else {
        setExecutionResults(res);
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        setExecutionError(
          err.message || "Unable to run the sample test cases.",
        );
      }
    } finally {
      if (!abortController.signal.aborted) {
        setExecutionLoading(false);
      }
    }
  }, [executionLoading, attempt?.code, currentQ, selectedLang, showToast]);

  // 4. Submit Handler (PRD Section 3.2 & 5.2)
  const handleSubmit = useCallback(async () => {
    if (executionLoading) return; // Prevent duplicate submissions

    const code = (attempt?.code || "").trim();
    if (code.length < 10) {
      showToast("Please write a complete solution before submitting.");
      return;
    }

    setActiveCodeSnapshot(code);
    setExecutionMode("submit");
    setExecutionLoading(true);
    setExecutionStage("Waiting in queue");
    setExecutionResults(null);
    setExecutionError("");

    const abortController = new AbortController();
    pollingAbortRef.current = abortController;

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const initialResponse = await executionApi.submit({
        slug: currentQ.slug || currentQ.key,
        problemId: currentQ.id || currentQ.key,
        language: selectedLang,
        code,
        idempotencyKey,
        wait: false,
      });

      const submissionId = initialResponse?.id;
      if (!submissionId) {
        throw new Error("Backend did not return a valid submission ID.");
      }

      // Save submission reference in storage for browser refresh recovery
      saveActiveSubmission(problemKey, {
        id: submissionId,
        mode: "submit",
        slug: currentQ.slug || currentQ.key,
        language: selectedLang,
      });

      setExecutionStage(getStatusDisplay(initialResponse.status));

      // Poll status until terminal verdict and trailing complexity settle
      const finalResult = await pollSubmissionWithComplexity(submissionId, {
        signal: abortController.signal,
        onExecutionProgress: (sub) => {
          setExecutionStage(getStatusDisplay(sub.status));
          setExecutionResults(sub);
        },
        onExecutionComplete: (sub) => {
          setExecutionResults(sub);
          clearActiveSubmission(problemKey);

          // Handle rewards & stats if accepted
          const isAccepted =
            String(sub.verdict || sub.status).toUpperCase() === "ACCEPTED" &&
            sub.totalCount > 0 &&
            sub.passedCount === sub.totalCount;

          if (isAccepted && sub.reward?.stats) {
            const reward = sub.reward;
            if (document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
            setState((s) => ({
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
            }));
          }
        },
        onComplexityUpdate: (complexity) => {
          setExecutionResults((prev) =>
            prev ? { ...prev, complexity } : prev,
          );
        },
      });

      setExecutionResults(finalResult);
      clearActiveSubmission(problemKey);
    } catch (err) {
      if (!abortController.signal.aborted) {
        setExecutionError(err.message || "Unable to submit this solution.");
        clearActiveSubmission(problemKey);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setExecutionLoading(false);
      }
    }
  }, [
    executionLoading,
    attempt?.code,
    currentQ,
    selectedLang,
    problemKey,
    showToast,
    setState,
  ]);

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

  const handleQuizSubmit = async () => {
    if (currentQ.slug) {
      try {
        await api.study.submitQuiz(currentQ.slug, {
          quiz_1: quizAnswer === "O(n)" ? 1 : 0,
        });
      } catch {
        // Fallback
      }
    }

    if (quizAnswer === "O(n)") {
      setQuizResult({
        correct: true,
        text: "Correct! The linear O(n) solution is optimal.",
      });
      setState((s) => ({ ...s, coins: s.coins + 15 }));
    } else {
      setQuizResult({
        correct: false,
        text: "Not optimal. A single pass achieves linear O(n) time.",
      });
    }
  };

  const visibleTestcases = (currentQ?.testcases || []).filter(
    (testcase) => testcase.isVisible !== false,
  );

  // Confidence badge color helper
  const getConfidenceBadge = (confidence) => {
    switch (String(confidence || "").toLowerCase()) {
      case "high":
        return {
          bg: "rgba(46, 212, 122, 0.15)",
          color: "#2ED47A",
          border: "rgba(46, 212, 122, 0.4)",
          label: "High Confidence",
        };
      case "medium":
        return {
          bg: "rgba(53, 230, 255, 0.15)",
          color: "#35E6FF",
          border: "rgba(53, 230, 255, 0.4)",
          label: "Medium Confidence",
        };
      case "low":
        return {
          bg: "rgba(255, 170, 0, 0.15)",
          color: "#FFAA00",
          border: "rgba(255, 170, 0, 0.4)",
          label: "Low Confidence",
        };
      default:
        return {
          bg: "rgba(143, 163, 196, 0.15)",
          color: "var(--mu)",
          border: "rgba(143, 163, 196, 0.3)",
          label: "Estimated",
        };
    }
  };

  const complexity = executionResults?.complexity;
  const isAcceptedVerdict =
    String(
      executionResults?.verdict || executionResults?.status || "",
    ).toUpperCase() === "ACCEPTED";

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <h1>{currentQ?.title || "Problem Solving Arena"}</h1>
            <span
              className={`dc d${["E", "M", "H"][currentQ?.difficulty || 0]}`}
            >
              {DIFFICULTY_LABELS[currentQ?.difficulty || 0]}
            </span>
          </div>
          <div className="mu" style={{ marginTop: "4px" }}>
            Topic: <b>{currentQ?.topic || "General"}</b> • {currentQ?.pts || 25}{" "}
            Base Pts • Expected Time: {currentQ?.expTime || "O(n)"}
            {state.videos?.[currentQ?.topic] ? (
              <span className="ok" style={{ marginLeft: "10px" }}>
                ✓ Concept Video Watched
              </span>
            ) : (
              <button
                className="btn ghost"
                style={{
                  marginLeft: "10px",
                  padding: "2px 8px",
                  fontSize: "11px",
                }}
                onClick={() => {
                  setActiveModal("video");
                  setModalData({ topic: currentQ?.topic });
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
              style={{
                fontSize: "12px",
                color: "var(--bad)",
                borderColor: "var(--bad)",
              }}
              onClick={handleAbandon}
            >
              Abandon Attempt
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Problem Statement + Coding Arena */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {/* Left Card: Problem Statement & Hints */}
        <div className="card">
          <h2>Problem Statement</h2>
          <p style={{ margin: "8px 0 14px", lineHeight: "1.6" }}>
            {currentQ?.description || currentQ?.text}
          </p>

          {currentQ?.ex && (
            <div
              style={{
                padding: "10px",
                background: "var(--cf)",
                borderRadius: "8px",
                border: "1px solid var(--ln)",
                marginBottom: "14px",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            >
              <div className="mu" style={{ marginBottom: "4px" }}>
                Example:
              </div>
              <div>{currentQ.ex}</div>
            </div>
          )}

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
                    <div className="mu" style={{ marginTop: "6px" }}>
                      Input
                    </div>
                    <pre
                      style={{
                        margin: "3px 0 8px",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {testcase.input ?? testcase.stdinSmall ?? ""}
                    </pre>
                    <div className="mu">Expected output</div>
                    <pre
                      style={{
                        margin: "3px 0 0",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {testcase.output ?? testcase.expectedSmall ?? ""}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="mu"
            style={{ fontSize: "13px", marginBottom: "14px" }}
          >
            Target: <b>{currentQ?.expTime || "O(n)"}</b> time,{" "}
            <b>{currentQ?.expSpace || "O(1)"}</b> auxiliary space.
          </div>

          {/* Mode Selector when not yet started */}
          {!attempt ? (
            <div
              style={{
                padding: "14px",
                background: "var(--cf)",
                borderRadius: "14px",
                border: "1px solid var(--ln)",
                textAlign: "center",
              }}
            >
              <h3>Select Practice Mode</h3>
              <p
                className="mu"
                style={{ fontSize: "13px", margin: "6px 0 14px" }}
              >
                Choose between verified fullscreen practice or flexible
                learning.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button className="btn" onClick={() => startMode("strict")}>
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
              {!isStrict && currentQ?.hints && currentQ.hints.length > 0 && (
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
                      <div
                        className="mu"
                        style={{ marginTop: "6px", fontSize: "13px" }}
                      >
                        {hint}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Card: Monaco Coding Arena & Results Panel */}
        <div className="card">
          {isStrict && (
            <div
              className="banner"
              style={{
                borderLeft: "3px solid var(--bad)",
                marginBottom: "10px",
              }}
            >
              <b>Strict Mode Active:</b> Fullscreen enabled. Proctored coding
              session.
            </div>
          )}

          {recovering && (
            <div
              className="banner"
              style={{
                borderLeft: "3px solid var(--ac)",
                marginBottom: "10px",
              }}
            >
              🔄 Resuming in-progress submission session for this problem...
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
              {/* Language Selector & Action Buttons */}
              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  alignItems: "center",
                }}
              >
                {supportedLanguages.length === 0 && !languageLoadError ? (
                  <Skeleton width="130px" height="34px" borderRadius="8px" />
                ) : (
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
                )}

                {languageLoadError && (
                  <span className="bad" role="alert">
                    {languageLoadError}
                  </span>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn ghost"
                    disabled={
                      !attempt ||
                      executionLoading ||
                      supportedLanguages.length === 0
                    }
                    onClick={handleRun}
                    title="Run against visible sample testcases"
                  >
                    {executionLoading && executionMode === "run"
                      ? "Running..."
                      : "Run"}
                  </button>
                  <button
                    className="btn"
                    disabled={
                      !attempt ||
                      executionLoading ||
                      supportedLanguages.length === 0
                    }
                    onClick={handleSubmit}
                    title="Submit solution for full judging"
                  >
                    {executionLoading && executionMode === "submit"
                      ? "Submitting..."
                      : "Submit"}
                  </button>
                </div>
              </div>

              {/* Monaco Editor Component */}
              <MonacoEditor
                language={selectedLang}
                value={
                  attempt
                    ? attempt.code
                    : getStarterTemplate(currentQ, selectedLang)
                }
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
                  showToast("Pasting is disabled in strict mode.");
                }}
                onRun={handleRun}
                onSubmit={handleSubmit}
              />

              {/* Execution In-Flight Progress Indicator (PRD Section 6) */}
              {executionLoading && (
                <div
                  className="banner"
                  role="status"
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      border: "2px solid var(--ac)",
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>
                    <b>{executionMode === "submit" ? "Submit" : "Run"}:</b>{" "}
                    {executionStage || "Executing batch testcases..."}
                  </span>
                </div>
              )}

              {/* Execution Error Banner (PRD Section 11) */}
              {executionError && (
                <div
                  className="banner bad"
                  role="alert"
                  style={{
                    marginTop: "14px",
                    borderLeft: "3px solid var(--bad)",
                  }}
                >
                  <b>Error:</b> {executionError}
                </div>
              )}

              {/* Execution Results Panel (PRD Section 7 & 8) */}
              {executionResults && !executionLoading && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "16px",
                    background: "var(--cf)",
                    borderRadius: "14px",
                    border: "1px solid var(--ln)",
                  }}
                >
                  {/* 7.1 Execution Summary Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      paddingBottom: "12px",
                      borderBottom: "1px solid var(--ln)",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            textTransform: "uppercase",
                            color: "var(--mu)",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {executionMode === "submit"
                            ? "Submission Verdict"
                            : "Run Verdict"}
                        </span>
                        {activeCodeSnapshot && (
                          <span
                            className="mu"
                            style={{
                              fontSize: "11px",
                              background: "var(--card)",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            Snapshot verified
                          </span>
                        )}
                      </div>
                      <h3
                        style={{
                          margin: "2px 0 0",
                          color: isAcceptedVerdict ? "#2ED47A" : "var(--bad)",
                        }}
                      >
                        {executionResults.verdict ||
                          executionResults.status ||
                          "Completed"}
                      </h3>
                    </div>

                    {/* Stats pills */}
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: "var(--card)",
                          border: "1px solid var(--ln)",
                          fontSize: "12px",
                        }}
                      >
                        <span className="mu">Testcases: </span>
                        <b>
                          {executionResults.passedCount ?? 0} /{" "}
                          {executionResults.totalCount ?? 0}
                        </b>
                      </div>

                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: "var(--card)",
                          border: "1px solid var(--ln)",
                          fontSize: "12px",
                        }}
                      >
                        <span className="mu">Runtime: </span>
                        <b>{formatRuntime(executionResults.time)}</b>
                      </div>

                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: "var(--card)",
                          border: "1px solid var(--ln)",
                          fontSize: "12px",
                        }}
                      >
                        <span className="mu">Memory: </span>
                        <b>{formatMemory(executionResults.memory)}</b>
                      </div>
                    </div>
                  </div>

                  {/* Rewards Banner when fully accepted */}
                  {isAcceptedVerdict && executionResults.reward && (
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        background: "rgba(46, 212, 122, 0.12)",
                        border: "1px solid rgba(46, 212, 122, 0.35)",
                        marginBottom: "14px",
                      }}
                    >
                      <b>🎉 Solution Accepted!</b>
                      <div className="mu" style={{ marginTop: "4px" }}>
                        Awarded:{" "}
                        <b style={{ color: "#2ED47A" }}>
                          +{executionResults.reward.points || 0} Pts
                        </b>{" "}
                        • Earned:{" "}
                        <b style={{ color: "#FFD400" }}>
                          +{executionResults.reward.coinsEarned || 0} Coins
                        </b>
                        {executionResults.tierReached && (
                          <span> • Reached {executionResults.tierReached}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 8. Dedicated Time and Space Complexity Section (PRD Section 8) */}
                  <div
                    style={{
                      borderRadius: "12px",
                      border: "1px solid var(--ln)",
                      background: "rgba(8, 16, 34, 0.65)",
                      padding: "14px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                      onClick={() => setComplexityCollapsed((prev) => !prev)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>⚡</span>
                        <b style={{ fontSize: "14px" }}>Complexity Analysis</b>
                        {complexity?.status === ComplexityStatus.PENDING && (
                          <span
                            className="mu"
                            style={{
                              fontSize: "11px",
                              fontStyle: "italic",
                            }}
                          >
                            (Running...)
                          </span>
                        )}
                      </div>
                      <span className="mu" style={{ fontSize: "12px" }}>
                        {complexityCollapsed ? "Expand ▼" : "Collapse ▲"}
                      </span>
                    </div>

                    {!complexityCollapsed && (
                      <div style={{ marginTop: "12px" }}>
                        {/* Case A: Pending State (PRD 8.3) */}
                        {(!complexity ||
                          complexity.status === ComplexityStatus.PENDING) && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px",
                              background: "rgba(47, 139, 255, 0.08)",
                              borderRadius: "8px",
                              fontSize: "13px",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                border: "2px solid var(--ac)",
                                borderTopColor: "transparent",
                                animation: "spin 0.8s linear infinite",
                              }}
                            />
                            <span>
                              Complexity analysis is running in the
                              background...
                            </span>
                          </div>
                        )}

                        {/* Case B: Completed or Low Confidence State */}
                        {(complexity?.status === ComplexityStatus.COMPLETED ||
                          complexity?.status ===
                            ComplexityStatus.LOW_CONFIDENCE) && (
                          <div style={{ display: "grid", gap: "10px" }}>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "10px",
                              }}
                            >
                              {/* Time Complexity Card */}
                              <div
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  background: "var(--card)",
                                  border: "1px solid var(--ln)",
                                }}
                              >
                                <div
                                  className="mu"
                                  style={{
                                    fontSize: "11px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Time Complexity
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <b
                                    style={{
                                      fontSize: "16px",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {complexity.time.bestEstimate}
                                  </b>
                                  {(() => {
                                    const badge = getConfidenceBadge(
                                      complexity.time.confidence,
                                    );
                                    return (
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          padding: "2px 7px",
                                          borderRadius: "999px",
                                          background: badge.bg,
                                          color: badge.color,
                                          border: `1px solid ${badge.border}`,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {badge.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Space Complexity Card */}
                              <div
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  background: "var(--card)",
                                  border: "1px solid var(--ln)",
                                }}
                              >
                                <div
                                  className="mu"
                                  style={{
                                    fontSize: "11px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Auxiliary Space Complexity
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <b
                                    style={{
                                      fontSize: "16px",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {complexity.space.bestEstimate}
                                  </b>
                                  {(() => {
                                    const badge = getConfidenceBadge(
                                      complexity.space.confidence,
                                    );
                                    return (
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          padding: "2px 7px",
                                          borderRadius: "999px",
                                          background: badge.bg,
                                          color: badge.color,
                                          border: `1px solid ${badge.border}`,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {badge.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* 8.4 Expandable Evidence & Explanation */}
                            {complexity.evidence?.length > 0 && (
                              <div style={{ marginTop: "4px" }}>
                                <button
                                  type="button"
                                  className="btn ghost"
                                  style={{
                                    fontSize: "11px",
                                    padding: "4px 10px",
                                  }}
                                  onClick={() =>
                                    setEvidenceExpanded((prev) => !prev)
                                  }
                                >
                                  {evidenceExpanded
                                    ? "Hide Analysis Evidence"
                                    : "Why this estimate? View Evidence"}
                                </button>

                                {evidenceExpanded && (
                                  <ul
                                    style={{
                                      margin: "8px 0 0",
                                      paddingLeft: "18px",
                                      fontSize: "12px",
                                      color: "var(--mu)",
                                      lineHeight: "1.6",
                                    }}
                                  >
                                    {complexity.evidence.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Case C: Unknown State (PRD 8.3) */}
                        {complexity?.status === ComplexityStatus.UNKNOWN && (
                          <div
                            style={{
                              padding: "10px",
                              background: "rgba(143, 163, 196, 0.08)",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "var(--mu)",
                            }}
                          >
                            <div>
                              <b>Time Complexity:</b> Unable to determine
                            </div>
                            <div style={{ marginTop: "4px" }}>
                              <b>Space Complexity:</b> Unable to determine
                            </div>
                            <p style={{ margin: "6px 0 0", fontSize: "11px" }}>
                              The dynamic control flow or library dependencies
                              could not be resolved statically.
                            </p>
                          </div>
                        )}

                        {/* Case D: Unavailable State (PRD 8.3) */}
                        {complexity?.status ===
                          ComplexityStatus.UNAVAILABLE && (
                          <div
                            style={{
                              padding: "10px",
                              background: "rgba(255, 107, 129, 0.08)",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "var(--bad)",
                            }}
                          >
                            Complexity analysis is currently unavailable. Your
                            execution verdict is unaffected.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 7.3 Test Cases List & Diagnostic Information */}
                  {executionResults.cases?.length ? (
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "13px",
                          marginBottom: "8px",
                        }}
                      >
                        Test Case Details
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {executionResults.cases.map((testcase, index) => {
                          const passed = Boolean(testcase.passed);
                          const isHidden = !testcase.isVisible;

                          return (
                            <div
                              key={testcase.testIndex ?? index}
                              style={{
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: `1px solid ${
                                  passed
                                    ? "rgba(46, 212, 122, 0.45)"
                                    : "rgba(255, 92, 122, 0.45)"
                                }`,
                                background: passed
                                  ? "rgba(46, 212, 122, 0.06)"
                                  : "rgba(255, 92, 122, 0.06)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <b>Test Case {index + 1}</b>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    color: passed ? "#2ED47A" : "var(--bad)",
                                  }}
                                >
                                  {passed
                                    ? "Passed ✓"
                                    : testcase.status || "Failed"}
                                </span>
                              </div>

                              {/* Anti-leak: Never expose hidden testcase inputs / expected */}
                              {isHidden ? (
                                <div
                                  className="mu"
                                  style={{
                                    marginTop: "6px",
                                    fontSize: "11px",
                                    fontStyle: "italic",
                                  }}
                                >
                                  🔒 Hidden evaluation testcase (inputs and
                                  outputs protected against leakage).
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "grid",
                                    gap: "6px",
                                    marginTop: "8px",
                                    fontSize: "12px",
                                  }}
                                >
                                  <div>
                                    <div className="mu">Input</div>
                                    <pre
                                      style={{
                                        margin: "2px 0 0",
                                        padding: "6px",
                                        background: "var(--card)",
                                        borderRadius: "6px",
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "anywhere",
                                      }}
                                    >
                                      {testcase.input ?? ""}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="mu">Expected</div>
                                    <pre
                                      style={{
                                        margin: "2px 0 0",
                                        padding: "6px",
                                        background: "var(--card)",
                                        borderRadius: "6px",
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "anywhere",
                                      }}
                                    >
                                      {testcase.expected ?? ""}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="mu">Actual Output</div>
                                    <pre
                                      style={{
                                        margin: "2px 0 0",
                                        padding: "6px",
                                        background: "var(--card)",
                                        borderRadius: "6px",
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "anywhere",
                                      }}
                                    >
                                      {testcase.actual ?? ""}
                                    </pre>
                                  </div>
                                  {testcase.errorText && (
                                    <div
                                      className="bad"
                                      style={{
                                        fontSize: "11px",
                                        marginTop: "4px",
                                      }}
                                    >
                                      {testcase.errorText}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="mu" style={{ margin: "8px 0 0" }}>
                      No detailed testcase outputs were returned.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Complexity Prediction Quiz Card */}
      <div className="card" style={{ marginTop: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h3>Private Notes</h3>
            <button
              className="x"
              style={{
                position: "static",
                width: "26px",
                height: "26px",
                fontSize: "16px",
              }}
              onClick={() => setShowNotes(false)}
            >
              ×
            </button>
          </div>
          <p className="mu" style={{ fontSize: "12px", margin: "2px 0 8px" }}>
            Notes are auto-saved locally for this problem.
          </p>
          <textarea
            value={state.notes?.[currentQ?.key] || ""}
            placeholder="Write your approach, edge cases, recurrence relations..."
            style={{ minHeight: "140px" }}
            onChange={(e) => {
              const val = e.target.value;
              setState((s) => ({
                ...s,
                notes: { ...s.notes, [currentQ?.key]: val },
              }));
            }}
          />
        </div>
      )}
    </div>
  );
}

export default SolveView;
