import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { LANGS } from "../../constants";
import { useStrictModeGuard } from "../../hooks/useStrictModeGuard";

export function SolveView() {
  const { currentQ, state, setState, setView, getTopicRating } = useCalibr8();
  const [selectedLang, setSelectedLang] = useState("JavaScript");
  const [showDryRun, setShowDryRun] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("O(n)");
  const [quizResult, setQuizResult] = useState(null);
  const [resultData, setResultData] = useState(null);

  const attempt = state.att;

  const startMode = (mode) => {
    setState((s) => ({
      ...s,
      att: {
        mode,
        code: "",
        hints: 0,
        locked: false,
        away: 0,
        active: true
      }
    }));

    if (mode === "strict") {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  const handleAbandon = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    setState((s) => ({ ...s, att: null }));
    setShowDryRun(false);
  };

  useStrictModeGuard({
    isActive: Boolean(attempt?.active),
    isStrict: attempt?.mode === "strict",
    onAwayWarning: (sec) => {
      setState((s) => {
        if (!s.att) return s;
        const awayCount = (s.att.away || 0) + 1;
        if (awayCount >= 2) {
          return { ...s, att: { ...s.att, locked: true, away: awayCount } };
        }
        alert(`Warning: You were away for ${Math.round(sec)} seconds. One more absence locks the question.`);
        return { ...s, att: { ...s.att, away: awayCount } };
      });
    },
    onLockout: () => {}
  });

  const handleUnlock = () => {
    if (state.coins < 500) return alert("Unlocking requires 500 coins.");
    setState((s) => ({
      ...s,
      coins: s.coins - 500,
      att: { ...s.att, locked: false, away: 0 }
    }));
  };

  const handleDryRun = () => {
    if (state.freeDry > 0) {
      setState((s) => ({ ...s, freeDry: s.freeDry - 1 }));
      setShowDryRun(true);
    } else if (state.coins >= 20) {
      setState((s) => ({ ...s, coins: s.coins - 20 }));
      setShowDryRun(true);
    } else {
      alert("Not enough coins for dry run (20 needed).");
    }
  };

  const handleSubmit = () => {
    const code = (attempt?.code || "").trim();
    if (code.length < 10) return alert("Please write a complete solution.");

    const normalized = code.toLowerCase();
    const passedTier = normalized.length < 25
      ? 0
      : /deque|monotonic/.test(normalized)
      ? 3
      : /sort|set|heap|map/.test(normalized)
      ? 2
      : 1;

    const share = [0, 0.3, 0.65, 1][passedTier];
    const mult = attempt.mode === "strict" ? 1.5 : 1.0;
    const pen = attempt.mode === "strict" ? 0 : [0, 0.05, 0.15, 0.35][attempt.hints || 0];

    const awardedPts = Math.max(0, Math.round((currentQ.pts * share * mult - pen * currentQ.pts) * 10) / 10);
    const earnedCoins = Math.round(awardedPts * 2);

    const prevBest = state.best?.[currentQ.key] || 0;
    const delta = Math.max(0, Math.round((awardedPts - prevBest) * 10) / 10);

    // Rating calculations
    const r0 = getTopicRating(currentQ.topic);
    const expected = 1 / (1 + Math.pow(10, (currentQ.d - r0) / 400));
    const scoreVal = [0, 0.4, 0.7, 1.0][passedTier];
    const K = (state.solves || 0) < 10 ? 60 : 32;
    const nextRating = Math.round(r0 + K * (scoreVal - expected));

    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});

    setState((s) => {
      const nextSolves = (s.solves || 0) + 1;
      const nextScore = s.score + Math.round(delta * 10);
      const isCalibrated = s.calibrating && nextSolves >= 10 && nextScore >= 1500;

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
        att: null
      };
    });

    setResultData({
      tier: passedTier,
      pts: delta,
      coins: earnedCoins,
      mode: attempt.mode
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">{currentQ.title}</h1>
          <p className="text-xs text-slate-400">
            {currentQ.topic} • {currentQ.pts} Base Points
          </p>
        </div>
        {attempt && (
          <button
            onClick={handleAbandon}
            className="rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
          >
            Abandon Attempt
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Problem & Hints */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-blue-500/20 bg-slate-900/60 p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-white mb-2">Problem Statement</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{currentQ.text}</p>
            <div className="rounded-lg bg-black/40 p-3 font-mono text-xs text-cyan-300 border border-white/5">
              {currentQ.ex}
            </div>
          </div>

          {!attempt ? (
            <div className="rounded-2xl border border-blue-500/20 bg-slate-900/60 p-5 text-center">
              <h3 className="text-sm font-medium text-white mb-2">Choose Mode</h3>
              <p className="text-xs text-slate-400 mb-4">
                Relaxed allows dry runs and paste. Strict runs fullscreen with anti-cheat for 1.5x score.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => startMode("relaxed")}
                  className="rounded-full border border-slate-600 px-4 py-2 text-xs text-slate-200 hover:bg-white/5"
                >
                  Start Relaxed (1.0x)
                </button>
                <button
                  onClick={() => startMode("strict")}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/25"
                >
                  Start Strict (1.5x)
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-500/20 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400 uppercase tracking-wider">
                  Mode: {attempt.mode}
                </span>
                {attempt.mode === "relaxed" && (
                  <button
                    onClick={handleDryRun}
                    className="rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1 text-cyan-300 hover:bg-blue-600/30"
                  >
                    Dry Run ({state.freeDry > 0 ? `${state.freeDry} Free` : "20 coins"})
                  </button>
                )}
              </div>

              {attempt.locked && (
                <div className="rounded-lg bg-red-900/30 border border-red-500/40 p-3 text-xs text-red-200 flex items-center justify-between">
                  <span>Question locked after away violations.</span>
                  <button
                    onClick={handleUnlock}
                    className="rounded bg-red-600 px-2.5 py-1 font-semibold text-white text-[11px]"
                  >
                    Unlock (500 Coins)
                  </button>
                </div>
              )}

              {attempt.mode === "relaxed" && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">Hints:</div>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        disabled={attempt.hints > i}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            att: { ...s.att, hints: i + 1 }
                          }))
                        }
                        className="rounded border border-slate-700 bg-black/30 px-2.5 py-1 text-[11px] text-slate-300 disabled:opacity-40"
                      >
                        Hint {i + 1}
                      </button>
                    ))}
                  </div>
                  {currentQ.hints.slice(0, attempt.hints).map((h, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2.5 text-xs text-cyan-200"
                    >
                      Hint {i + 1}: {h}
                    </div>
                  ))}
                </div>
              )}

              {showDryRun && (
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-black/60 p-2">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="p-1">Step</th>
                        <th className="p-1">Window</th>
                        <th className="p-1">Max</th>
                        <th className="p-1">Min</th>
                        <th className="p-1">Best</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentQ.trace.map((r, i) => (
                        <tr key={i} className="border-b border-slate-900">
                          <td className="p-1 font-mono text-cyan-400">{r[0]}</td>
                          <td className="p-1">{r[1]}</td>
                          <td className="p-1">{r[2]}</td>
                          <td className="p-1">{r[3]}</td>
                          <td className="p-1 font-semibold text-white">{r[4]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Code Editor */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-blue-500/20 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3">
              <label className="text-xs text-slate-400 flex items-center gap-2">
                Language:
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                >
                  {LANGS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              <button
                disabled={!attempt || attempt.locked}
                onClick={handleSubmit}
                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-1.5 text-xs font-semibold text-white shadow-lg disabled:opacity-40"
              >
                Submit Code
              </button>
            </div>

            <textarea
              rows={14}
              disabled={!attempt || attempt.locked}
              value={attempt?.code || ""}
              onChange={(e) => {
                const val = e.target.value;
                setState((s) => ({
                  ...s,
                  att: { ...s.att, code: val }
                }));
              }}
              placeholder={attempt ? "// Write your solution here..." : "// Start an attempt to begin coding..."}
              className="w-full rounded-xl border border-slate-800 bg-[#02060f] p-4 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500/50"
            />
          </div>

          {resultData && (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 text-white space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-300">
                  {resultData.tier === 0
                    ? "Incomplete Solution"
                    : `Passed Tier ${resultData.tier}: ${["", "Brute Force", "Better Solution", "Optimal"][resultData.tier]}`}
                </span>
                <span className="text-xs text-slate-400">
                  +{resultData.pts} pts • +{resultData.coins} coins
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span>Estimated Time Complexity:</span>
                <select
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  className="rounded bg-black border border-slate-700 px-2 py-1 text-white"
                >
                  <option value="O(n^2)">O(n^2)</option>
                  <option value="O(n log n)">O(n log n)</option>
                  <option value="O(n)">O(n)</option>
                </select>
                <button
                  onClick={() => {
                    const isOptimal = quizAnswer === (resultData.tier === 3 ? "O(n)" : "O(n^2)");
                    setQuizResult(isOptimal ? "Correct! +2 bonus points" : "Not quite");
                    if (isOptimal) setState((s) => ({ ...s, score: s.score + 20 }));
                  }}
                  className="rounded border border-blue-400/40 px-2 py-1 text-cyan-300"
                >
                  Verify
                </button>
                {quizResult && <span className="text-cyan-400">{quizResult}</span>}
              </div>

              <button
                onClick={() => setView("home")}
                className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}