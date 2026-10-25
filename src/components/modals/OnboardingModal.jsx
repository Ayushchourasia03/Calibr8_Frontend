import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

const ONBOARD_TOPICS = [
  "Arrays",
  "Strings",
  "Recursion",
  "Graphs",
  "Sliding Window",
  "DP",
  "SQL",
  "Aptitude",
];

const ONBOARD_LANGS = [
  "Python",
  "Python3",
  "JavaScript",
  "TypeScript",
  "C++",
  "Java",
  "C",
  "Go",
  "Kotlin",
  "Swift",
  "Rust",
  "Ruby",
  "PHP",
  "C#",
];

export function OnboardingModal() {
  const {
    state,
    setState,
    activeModal,
    setActiveModal,
    modalData,
    setView,
    showToast,
    login,
    register,
    logout,
    saveOnboarding,
    updateLanguage,
    setTopicLevel,
  } = useCalibr8();

  const isOpen = activeModal === "onboarding";

  const [step, setStep] = useState(() => {
    if (modalData?.step !== undefined) return modalData.step;
    if (state.started && state.user) return 1;
    return 0;
  });
  const [authMode, setAuthMode] = useState(() => modalData?.authMode || "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLang, setSelectedLang] = useState(() => state.lang || "Python");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const close = () => {
    setActiveModal(null);
    setError("");
  };

  const L = state.levels || {};
  const chosenCount = Object.keys(L).length;

  // --- Auth Handlers (Step 1) ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (authMode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (authMode === "login") {
        await login({ email: cleanEmail, password });
        showToast("Signed in successfully.");
      } else {
        await register({ name: name.trim(), email: cleanEmail, password });
        showToast("Account created successfully.");
      }
      setError("");
      setStep(1); // Proceed to step 2 (Topics)
    } catch (err) {
      const msg = err.message || err.data?.message || "Authentication failed. Please verify your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setState((s) => ({
      ...s,
      user: { guest: true, email: "guest@calibr8.local", name: "Guest Learner" },
    }));
    setError("");
    setStep(1);
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setError("");
    try {
      await login({ email: "jane@example.com", password: "password123" });
      showToast("Signed in as Demo User (Jane Doe).");
      setStep(1);
    } catch (err) {
      setError(err.message || "Failed to log in to demo account.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Signed out.");
    } catch (err) {
      console.warn("Logout note:", err);
    }
    setEmail("");
    setPassword("");
  };

  // --- Topic Handlers (Step 2) ---
  const handleToggleTopic = (topic) => {
    if (topic in L) {
      if (chosenCount > 1) {
        setTopicLevel(topic, null);
      } else {
        showToast("Please keep at least one topic selected.");
      }
    } else {
      setTopicLevel(topic, 1); // Default to Medium if newly added
    }
  };

  const handleSetLevel = (topic, lvl) => {
    setTopicLevel(topic, lvl);
  };

  const handleQuickAllEasy = () => {
    ONBOARD_TOPICS.forEach((t) => setTopicLevel(t, 0));
    showToast("All topics set to Easy.");
  };

  const handleStartFromScratch = () => {
    // Beginner preset: Arrays & Strings on Easy
    setState((s) => {
      const nextLevels = { Arrays: 0, Strings: 0 };
      const nextRatings = { Arrays: 800, Strings: 800 };
      return {
        ...s,
        levels: nextLevels,
        ratings: nextRatings,
        rating: 800,
      };
    });
    showToast("Starting from scratch: Arrays & Strings on Easy.");
  };

  // --- Journey Finalization (Step 3) ---
  const handleFinish = async () => {
    if (!chosenCount) {
      showToast("Pick at least one topic before continuing.");
      setStep(1);
      return;
    }

    const topicKeys = Object.keys(state.levels || {});
    const ratings = topicKeys.map((t) => state.ratings?.[t] || 800);
    const avgRating = Math.round(
      ratings.reduce((a, b) => a + b, 0) / (ratings.length || 1)
    );

    setState((s) => ({
      ...s,
      started: true,
      rating: avgRating,
      lang: selectedLang,
      calibrating: true,
      freeDry: s.freeDry || 3,
    }));

    // Sync with backend onboarding API
    try {
      const topicSelections = Object.entries(state.levels || {}).map(([topic, lvl]) => ({
        topicId: `dsa-${topic.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        difficulty: ["easy", "medium", "hard"][lvl] || "medium",
      }));
      await saveOnboarding({ topicSelections });
      await updateLanguage(selectedLang.toLowerCase().replace(/[^a-z]/g, ""));
    } catch (err) {
      console.warn("Backend onboarding sync note:", err.message);
    }

    showToast("Welcome to Calibr8! Your daily journey is ready.");
    close();
    setView("home");
  };

  const currentUser = state.user;

  return (
    <div className="modal" onClick={close}>
      <div
        className="sheet onboard"
        role="dialog"
        aria-modal="true"
        aria-label="Set up Calibr8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular Close Button */}
        <button className="x" aria-label="Close" onClick={close}>
          ×
        </button>

        {/* Step Indicator Dots */}
        <div className="dots" aria-label={`Step ${step + 1} of 3`}>
          <i className={step === 0 ? "on" : step > 0 ? "done" : ""} />
          <i className={step === 1 ? "on" : step > 1 ? "done" : ""} />
          <i className={step === 2 ? "on" : ""} />
        </div>
        <div className="step-txt">Step {step + 1} of 3</div>

        {/* ==================================================================
            Step 1: Welcome & Authentication / Guest
            ================================================================== */}
        {step === 0 && (
          <div>
            <h2>Welcome to Calibr8</h2>
            <p className="mu">
              Log in to keep your progress on every device, or continue as a guest.
            </p>

            {currentUser && (
              <div className="onboard-banner">
                {currentUser.guest ? (
                  <span>You are a guest on this device.</span>
                ) : (
                  <span>
                    You are logged in as <b>{currentUser.email}</b>.
                  </span>
                )}
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "rgba(255, 92, 122, 0.15)",
                  color: "#d92550",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "12px",
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <div>
                  <label className="mu" style={{ fontWeight: 600 }}>
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="mu" style={{ fontWeight: 600 }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mu" style={{ fontWeight: 600 }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-dark"
                disabled={loading}
                style={{ width: "100%", marginTop: "6px" }}
              >
                {loading
                  ? "Processing..."
                  : authMode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode((m) => (m === "login" ? "register" : "login"));
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1B63FF",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {authMode === "login"
                  ? "New to Calibr8? Create an account"
                  : "Already have an account? Log in"}
              </button>
            </div>

            <div className="or">
              <span>or</span>
            </div>

            <button
              type="button"
              className="btn-white"
              onClick={handleGuest}
              style={{ width: "100%", textAlign: "center" }}
            >
              Continue as guest
            </button>

            <button
              type="button"
              className="btn-white"
              onClick={handleQuickDemo}
              style={{ width: "100%", marginTop: "8px", fontSize: "12px", opacity: 0.85 }}
            >
              🚀 1-Click Demo Account (Jane Doe)
            </button>

            <p className="mu" style={{ marginTop: "12px", fontSize: "12px" }}>
              Demo login for now: there is no server yet, so your email stays on this device. Guest progress is saved on this device only.
            </p>

            {currentUser && (
              <div
                className="row"
                style={{
                  marginTop: "16px",
                  justifyContent: "space-between",
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                  paddingTop: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn-white"
                  onClick={handleLogout}
                  style={{ fontSize: "12px" }}
                >
                  Sign out
                </button>
                <button
                  type="button"
                  className="btn-white"
                  onClick={() => setStep(1)}
                  style={{ fontWeight: 700 }}
                >
                  Keep going →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            Step 2: Topic Levels Calibration
            ================================================================== */}
        {step === 1 && (
          <div>
            <h2>Choose your level for each topic</h2>
            <p className="mu">
              No entry test. Pick the topics you want and a level for each. Saved as you click.
            </p>

            <div className="row" style={{ gap: "8px", marginBottom: "14px" }}>
              <button
                type="button"
                className="btn-white"
                onClick={handleQuickAllEasy}
              >
                Quick start: all Easy
              </button>
              <button
                type="button"
                className="btn-white"
                onClick={handleStartFromScratch}
              >
                Start from scratch
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {ONBOARD_TOPICS.map((topic) => {
                const isSelected = topic in L;
                const currentLevel = isSelected ? L[topic] : 1;

                return (
                  <div key={topic} className="topic-row">
                    <button
                      type="button"
                      onClick={() => handleToggleTopic(topic)}
                      className={`topic-pill ${isSelected ? "" : "off"}`}
                      title={isSelected ? "Click to deselect" : "Click to select"}
                    >
                      {topic}
                    </button>

                    <div className="level-group">
                      {["Easy", "Medium", "Hard"].map((lvlLabel, idx) => {
                        const isLvlOn = isSelected && currentLevel === idx;
                        return (
                          <button
                            key={lvlLabel}
                            type="button"
                            onClick={() => handleSetLevel(topic, idx)}
                            className={`level-btn ${isLvlOn ? "on" : ""}`}
                          >
                            {lvlLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mu" style={{ margin: "14px 0 16px" }}>
              {chosenCount} topic(s) chosen
            </p>

            <div className="row" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn-white"
                onClick={() => setStep(0)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-dark"
                disabled={chosenCount === 0}
                onClick={() => setStep(2)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================
            Step 3: Primary Programming Language
            ================================================================== */}
        {step === 2 && (
          <div>
            <h2>Pick your language</h2>
            <p className="mu">
              This is the language your editor starts in. You can change it on any question.
            </p>

            <div style={{ margin: "16px 0 24px" }}>
              <select
                aria-label="Language"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
              >
                {ONBOARD_LANGS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="row" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn-white"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-dark"
                onClick={handleFinish}
              >
                Start my journey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingModal;
