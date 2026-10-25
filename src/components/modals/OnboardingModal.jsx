import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { TOPS, LANGS, DIFFICULTY_LABELS } from "../../data/constants";

export function OnboardingModal() {
  const {
    state,
    setState,
    activeModal,
    setActiveModal,
    setTopicLevel,
    setView,
    setCurrentQ,
    showToast,
    login,
    register,
    saveOnboarding,
    updateLanguage,
  } = useCalibr8();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(state.user?.email || "");

  if (activeModal !== "onboarding") return null;

  const close = () => setActiveModal(null);

  const handleGuest = () => {
    setState((s) => ({ ...s, user: { guest: true } }));
    setStep(1);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      showToast("Please enter a valid email address.");
      return;
    }

    try {
      // Attempt login with backend API
      await login({ email: cleanEmail, password: "Password123!" });
      showToast("Signed in successfully.");
    } catch {
      // If login fails, attempt auto-registration for onboarding
      try {
        const username = cleanEmail.split("@")[0];
        await register({
          name: username.charAt(0).toUpperCase() + username.slice(1),
          email: cleanEmail,
          password: "Password123!",
        });
        showToast("Account created & synced.");
      } catch {
        // Fallback to local session if backend offline
        setState((s) => ({ ...s, user: { guest: false, email: cleanEmail } }));
      }
    }

    setStep(1);
  };

  const handleQuickAllEasy = () => {
    TOPS.forEach((t) => setTopicLevel(t, 0));
  };

  const handleStartFromScratch = () => {
    setState((s) => ({
      ...s,
      levels: { Arrays: 0, Strings: 0 },
      ratings: { Arrays: 800, Strings: 800 },
      rating: 800,
    }));
  };

  const handleFinish = async (selectedLang) => {
    const k = Object.keys(state.levels || {});
    if (!k.length) {
      showToast("Please choose at least one topic.");
      return;
    }

    const firstTopic = k[0];
    const ratings = k.map((t) => state.ratings?.[t] || 800);
    const avgRating = Math.round(
      ratings.reduce((a, b) => a + b, 0) / ratings.length,
    );

    setState((s) => ({
      ...s,
      started: true,
      rating: avgRating,
      lang: selectedLang,
    }));

    // Persist onboarding calibration to backend API (/api/onboarding)
    try {
      const topicSelections = Object.entries(state.levels || {}).map(([topic, lvl]) => ({
        topicId: topic.toLowerCase().replace(/\s+/g, "-"),
        difficulty: ["easy", "medium", "hard"][lvl] || "medium",
      }));
      await saveOnboarding({ topicSelections });
      await updateLanguage(selectedLang.toLowerCase().replace(/[^a-z]/g, ""));
    } catch (err) {
      console.warn("Backend onboarding sync note:", err.message);
    }

    // Diagnostic starting question
    setCurrentQ({
      key: "diag_1",
      slug: `diag-${firstTopic.toLowerCase()}`,
      title: `${firstTopic}: Frontier Diagnostic`,
      topic: firstTopic,
      d: avgRating,
      difficulty: 0,
      pts: 100,
      text: `Given an input structure, solve the canonical ${firstTopic} problem under optimal time complexity.`,
      ex: "Input: data = [2, 7, 11, 15], target = 9 -> Output: [0, 1]",
      hints: ["Consider using hash lookup or monotonic window."],
      expTime: "O(n)",
      expSpace: "O(1)",
    });

    close();
    setView("solve");
  };

  const L = state.levels || {};

  return (
    <div className="modal" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close}>
          ×
        </button>

        {/* Step Indicator Dots */}
        <div className="dots">
          <i className={step === 0 ? "on" : step > 0 ? "done" : ""} />
          <i className={step === 1 ? "on" : step > 1 ? "done" : ""} />
          <i className={step === 2 ? "on" : ""} />
        </div>

        {/* Step 0: Authentication / Guest */}
        {step === 0 && (
          <div>
            <h2>Sign in to Calibr8</h2>
            <p className="mu" style={{ margin: "4px 0 16px" }}>
              Keep your streaks, Elo rating, and leaderboard rankings across all devices.
            </p>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="email"
                placeholder="you@college.edu or personal email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: "10px 14px", width: "100%" }}
              />

              <button type="submit" className="btn" style={{ width: "100%" }}>
                Continue with Email
              </button>
            </form>

            <div className="or">or</div>

            <button
              onClick={handleGuest}
              className="btn ghost"
              style={{ width: "100%" }}
            >
              Continue as Guest (Local Storage)
            </button>
          </div>
        )}

        {/* Step 1: Topic Selection */}
        {step === 1 && (
          <div>
            <h2>Choose your topics</h2>
            <p className="mu" style={{ margin: "4px 0 14px" }}>
              Select the data structures and algorithms you want in your daily rotation.
            </p>

            <div className="row" style={{ gap: "6px", marginBottom: "12px" }}>
              <button
                className="btn ghost"
                style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={handleQuickAllEasy}
              >
                Select All
              </button>
              <button
                className="btn ghost"
                style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={handleStartFromScratch}
              >
                Beginner Reset
              </button>
            </div>

            <div className="chips">
              {TOPS.map((t) => {
                const hasTopic = t in L;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      if (hasTopic) {
                        setTopicLevel(t, null);
                      } else {
                        setTopicLevel(t, 0);
                      }
                    }}
                    className={`chip ${hasTopic ? "on" : ""}`}
                  >
                    {t} {hasTopic && "✓"}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
              <button
                className="btn ghost"
                onClick={() => setStep(0)}
              >
                Back
              </button>
              <button
                className="btn"
                disabled={!Object.keys(L).length}
                onClick={() => setStep(2)}
              >
                Next: Language & Level →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Language and Starting Level */}
        {step === 2 && (
          <div>
            <h2>Primary Language & Calibration</h2>
            <p className="mu" style={{ margin: "4px 0 14px" }}>
              Pick your primary coding language for Monaco editor and adjust individual topic levels.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <div className="mu" style={{ marginBottom: "4px", fontSize: "12px" }}>Primary Language</div>
              <select
                value={state.lang || "Python3"}
                onChange={(e) => setState((s) => ({ ...s, lang: e.target.value }))}
                style={{ width: "100%", padding: "8px" }}
              >
                {LANGS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              {Object.keys(L).map((t) => (
                <div key={t} className="tr">
                  <b>{t}</b>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0, 1, 2].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setTopicLevel(t, lvl)}
                        className={`pill ${L[t] === lvl ? "on" : ""}`}
                        style={{ fontSize: "11px", padding: "2px 8px" }}
                      >
                        {DIFFICULTY_LABELS[lvl]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                className="btn ghost"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                className="btn"
                onClick={() => handleFinish(state.lang || "Python3")}
              >
                Start Practicing Now 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
