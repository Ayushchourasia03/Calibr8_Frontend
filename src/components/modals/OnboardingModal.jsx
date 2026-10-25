import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { onboardingApi } from "./onboardingApi";
import { authApi } from "./authApi";

// Strictly DSA topics for calibration (API details.md Section 7.2 & 8)
const DSA_ONBOARD_TOPICS = [
  "Arrays",
  "Strings",
  "Recursion",
  "Graphs",
  "Sliding Window",
  "DP",
  "Trees",
  "Linked List",
];

const ONBOARD_LANGS = [
  "Python",
  "JavaScript",
  "C++",
  "Java",
  "Python3",
  "TypeScript",
  "Go",
  "Kotlin",
  "Rust",
  "C#",
  "C",
  "Ruby",
  "PHP",
  "Swift",
];

export function OnboardingModal() {
  const { state, setState, activeModal, setActiveModal, modalData, showToast } =
    useCalibr8();

  const isOpen = activeModal === "onboarding";

  const [step, setStep] = useState(() => {
    if (modalData?.step !== undefined) return modalData.step;
    return 0;
  });
  const [authMode, setAuthMode] = useState(
    () => modalData?.authMode || "login",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLang, setSelectedLang] = useState(
    () => state.lang || "Python",
  );
  const [selectedTopics, setSelectedTopics] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const close = () => {
    setSelectedTopics(new Set());
    setActiveModal(null);
    setError("");
  };

  // --- Auth Handlers (Step 1) ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password.length > 72) {
      setError("Password cannot exceed 72 bytes.");
      return;
    }

    if (password.toLowerCase() === cleanEmail) {
      setError("Password must differ from the email address.");
      return;
    }

    if (authMode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (authMode === "login") {
        const res = await authApi.login({ email: cleanEmail, password });
        if (res?.user) {
          setState((s) => ({
            ...s,
            user: res.user,
            started: res.user.onboarded || s.started,
          }));
        }
        showToast("Signed in successfully.");
      } else {
        const res = await authApi.register({
          name: name.trim(),
          email: cleanEmail,
          password,
        });
        if (res?.user) {
          setState((s) => ({
            ...s,
            user: res.user,
            started: false,
          }));
        }
        showToast("Account created successfully.");
      }
      setError("");
      setStep(1); // Proceed to Step 2 (DSA Topic Calibration)
    } catch (err) {
      setError(
        err.message || "Authentication failed. Please verify your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setState((s) => ({
      ...s,
      user: {
        guest: true,
        email: "guest@calibr8.local",
        name: "Guest Learner",
      },
    }));
    setError("");
    setStep(1);
  };

  // --- Topic Handlers (Step 2) ---
  const handleSetLevel = (topic, lvl) => {
    const ratingValue = [800, 1200, 1600][lvl];
    setSelectedTopics((topics) => new Set(topics).add(topic));
    setState((s) => ({
      ...s,
      levels: {
        ...s.levels,
        [topic]: lvl,
      },
      ratings: {
        ...s.ratings,
        [topic]: ratingValue,
      },
    }));
  };

  const handleQuickAllEasy = () => {
    setSelectedTopics(new Set(DSA_ONBOARD_TOPICS));
    const nextLevels = { ...state.levels };
    const nextRatings = { ...state.ratings };
    DSA_ONBOARD_TOPICS.forEach((t) => {
      nextLevels[t] = 0; // Easy
      nextRatings[t] = 800;
    });
    setState((s) => ({
      ...s,
      levels: nextLevels,
      ratings: nextRatings,
      rating: 800,
    }));
    showToast("All DSA topics set to Easy (800 rating).");
  };

  const handleStartFromScratch = () => {
    setSelectedTopics(new Set(DSA_ONBOARD_TOPICS));
    const nextLevels = { ...state.levels };
    const nextRatings = { ...state.ratings };
    DSA_ONBOARD_TOPICS.forEach((t) => {
      nextLevels[t] = 0; // Easy
      nextRatings[t] = 800;
    });
    setState((s) => ({
      ...s,
      levels: nextLevels,
      ratings: nextRatings,
      rating: 800,
    }));
    showToast("Reset to scratch: all DSA topics at Easy.");
  };

  // --- Journey Finalization (Step 3) ---
  const handleFinish = async () => {
    const selectedTopicLevels = Array.from(selectedTopics, (topic) => [
      topic,
      state.levels?.[topic] ?? 0,
    ]);
    if (selectedTopicLevels.length === 0) {
      setError("Choose a level for at least one topic to continue.");
      return;
    }

    setError("");
    setFinishing(true);
    const ratings = selectedTopicLevels.map(
      ([topic]) => state.ratings?.[topic] ?? 800,
    );
    const avgRating = Math.round(
      ratings.reduce((a, b) => a + b, 0) / (ratings.length || 1),
    );

    try {
      const topicSelections = selectedTopicLevels.map(([topic, lvl]) => ({
        topicId: `dsa-${topic.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        difficulty: ["easy", "medium", "hard"][lvl] || "easy",
      }));
      const result = state.user?.guest
        ? { success: true }
        : await onboardingApi.submit({ topicSelections });

      if (!result?.success) {
        throw new Error("Onboarding could not be saved. Please try again.");
      }

      const language = {
        Python: "python",
        Python3: "python",
        JavaScript: "javascript",
        "C++": "cpp",
        Java: "java",
        C: "c",
      }[selectedLang];
      if (language && !state.user?.guest) {
        try {
          await onboardingApi.updateLanguage(language);
        } catch (err) {
          console.warn("Backend language sync note:", err.message);
        }
      }

      setState((s) => ({
        ...s,
        started: true,
        rating: result.user?.rating ?? (avgRating || 800),
        lang: selectedLang,
        calibrating: true,
        freeDry: s.freeDry || 3,
        view: "home",
        user: s.user
          ? { ...s.user, ...(result.user || {}), onboarded: true }
          : s.user,
      }));

      showToast("Welcome to Calibr8! Your daily practice is ready.");
      close();
    } catch (err) {
      setError(
        err.message || "Onboarding could not be saved. Please try again.",
      );
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="onboard-modal-overlay" onClick={close}>
      <div
        className="onboard-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Set up Calibr8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular Close Button */}
        <button
          type="button"
          className="modal-close-circle"
          aria-label="Close"
          onClick={close}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Stepper Header (Image 2 and 3 style) */}
        <div className="onboard-stepper-header">
          <div
            className="stepper-indicators"
            aria-label={`Step ${step + 1} of 3`}
          >
            <span
              className={`stepper-mark ${step === 0 ? "pill-active" : "dot-done"}`}
            />
            <span
              className={`stepper-mark ${step === 1 ? "pill-active" : step > 1 ? "dot-done" : "dot-inactive"}`}
            />
            <span
              className={`stepper-mark ${step === 2 ? "pill-active" : "dot-inactive"}`}
            />
          </div>
          <div className="stepper-step-label">Step {step + 1} of 3</div>
        </div>

        {/* ==================================================================
            Step 1: Auth (Login / Register)
            ================================================================== */}
        {step === 0 && (
          <div className="onboard-step-container">
            <h2 className="onboard-title">
              {authMode === "login"
                ? "Sign in to Calibr8"
                : "Create your account"}
            </h2>
            <p className="onboard-subtitle">
              Sign in to keep your calibration, streak, and verified rank synced
              across devices.
            </p>

            {/* Auth Mode Switcher */}
            <div className="onboard-auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </div>

            {error && <div className="onboard-error-banner">{error}</div>}

            <form onSubmit={handleAuthSubmit} className="onboard-form">
              {authMode === "register" && (
                <div className="onboard-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="onboard-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="onboard-field">
                <label>Password</label>
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
                className="modal-btn-dark modal-btn-full"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : authMode === "login"
                    ? "Sign In & Continue"
                    : "Create Account & Continue"}
              </button>
            </form>

            <div className="onboard-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="modal-btn-white modal-btn-full"
              onClick={handleGuest}
            >
              Continue as guest
            </button>
          </div>
        )}

        {/* ==================================================================
            Step 2: DSA Topic Levels Calibration (Image 2 - Strictly DSA Topics)
            Every topic has a consistent dark pill and an explicitly selected level
            ================================================================== */}
        {step === 1 && (
          <div className="onboard-step-container">
            <h2 className="onboard-title">Choose your level for each topic</h2>
            <p className="onboard-subtitle">
              No entry test. Pick the topics you want and a level for each.
              Saved as you click.
            </p>

            {/* Quick Actions (Matching Image 2) */}
            <div className="onboard-quick-actions">
              <button
                type="button"
                className="quick-pill-btn"
                onClick={handleQuickAllEasy}
              >
                Quick start: all Easy
              </button>
              <button
                type="button"
                className="quick-pill-btn"
                onClick={handleStartFromScratch}
              >
                Start from scratch
              </button>
            </div>

            {/* Strictly DSA Topics List with Consistent Active Level Highlighting */}
            <div className="onboard-topics-list">
              {DSA_ONBOARD_TOPICS.map((topic) => {
                const currentLevel = state.levels?.[topic];

                return (
                  <div key={topic} className="onboard-topic-row">
                    <div
                      className="topic-badge-pill"
                      title={`DSA Topic: ${topic}`}
                    >
                      {topic}
                    </div>

                    <div className="level-btn-group">
                      {["Easy", "Medium", "Hard"].map((lvlLabel, idx) => {
                        const isLvlOn =
                          selectedTopics.has(topic) && currentLevel === idx;
                        return (
                          <button
                            key={lvlLabel}
                            type="button"
                            onClick={() => handleSetLevel(topic, idx)}
                            className={`level-choice-btn ${isLvlOn ? "active" : ""}`}
                            aria-pressed={isLvlOn}
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

            {/* Step 2 Footer: chosen count & Back/Next */}
            <div className="onboard-step-footer">
              <div className="footer-left-group">
                <span className="chosen-count-label">
                  {DSA_ONBOARD_TOPICS.length} DSA topics calibrated
                </span>
                <button
                  type="button"
                  className="modal-btn-white"
                  onClick={() => setStep(0)}
                >
                  Back
                </button>
              </div>
              <button
                type="button"
                className="modal-btn-dark"
                onClick={() => setStep(2)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================
            Step 3: Primary Programming Language (Image 3)
            ================================================================== */}
        {step === 2 && (
          <div className="onboard-step-container">
            <h2 className="onboard-title">Pick your language</h2>
            <p className="onboard-subtitle">
              This is the language your editor starts in. You can change it on
              any question.
            </p>

            {error && <div className="onboard-error-banner">{error}</div>}

            <div className="language-select-wrapper">
              <select
                aria-label="Pick your language"
                className="language-select-dropdown"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
              >
                {ONBOARD_LANGS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <div className="dropdown-chevron-icon" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            {/* Step 3 Footer: Back and Start my journey */}
            <div className="onboard-step-footer">
              <button
                type="button"
                className="modal-btn-white"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="modal-btn-dark"
                onClick={handleFinish}
                disabled={finishing}
              >
                {finishing ? "Saving..." : "Start my journey"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingModal;
