import { useState } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { ALL_TOPICS } from "../../constants";

export function LandingView() {
  const { state, setState, setView, user, login, register, saveOnboarding } =
    useCalibr8();

  // Modal state: open/close and step (1 or 2)
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [authMode, setAuthMode] = useState("register"); // "register" | "login"

  // Step 1 Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Step 2 Calibration state
  const [calibrationMode, setCalibrationMode] = useState("beginner"); // "beginner" | "custom"
  const [customLevels, setCustomLevels] = useState(() => {
    const initial = {};
    ALL_TOPICS.forEach((t) => {
      initial[t] = state.levels?.[t] ?? 0;
    });
    return initial;
  });
  const [isSavingCalibration, setIsSavingCalibration] = useState(false);

  // Open modal handler
  const handleOpenGetStarted = (initialMode = "register") => {
    setAuthMode(initialMode);
    setAuthError("");
    // If user is already authenticated, jump straight to Step 2
    if (user) {
      setModalStep(2);
    } else {
      setModalStep(1);
    }
    setIsGetStartedOpen(true);
  };

  // Step 1: Submit Auth Form
  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmittingAuth(true);

    try {
      if (authMode === "login") {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
      // Successfully authenticated -> advance to step 2
      setModalStep(2);
    } catch (err) {
      setAuthError(
        err.message || "Authentication failed. Please check your credentials.",
      );
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Step 1: Skip to Step 2 (Guest mode)
  const handleSkipAuth = () => {
    setAuthError("");
    setModalStep(2);
  };

  // Step 2: Complete Calibration
  const handleCompleteCalibration = async (mode) => {
    setIsSavingCalibration(true);

    const LEVEL_RATINGS = [800, 1200, 1600];
    const newLevels = {};
    const newRatings = {};

    ALL_TOPICS.forEach((topic) => {
      const lvl = mode === "beginner" ? 0 : (customLevels[topic] ?? 0);
      newLevels[topic] = lvl;
      newRatings[topic] = LEVEL_RATINGS[lvl];
    });

    const sum = Object.values(newRatings).reduce((a, b) => a + b, 0);
    const overallRating = Math.round(sum / ALL_TOPICS.length);

    setState((s) => ({
      ...s,
      levels: newLevels,
      ratings: newRatings,
      rating: overallRating,
      started: true,
    }));

    if (user && saveOnboarding) {
      try {
        const payloadTopics = ALL_TOPICS.map((t) => ({
          topicId: t,
          difficulty: ["easy", "medium", "hard"][newLevels[t]],
          rating: newRatings[t],
        }));
        await saveOnboarding({
          rating: overallRating,
          topics: payloadTopics,
        });
      } catch (err) {
        console.warn("Could not sync calibration to cloud:", err.message);
      }
    }

    setIsSavingCalibration(false);
    setIsGetStartedOpen(false);
    setView("home");
  };

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* ─── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div
            onClick={() => setView("landing")}
            className="cursor-pointer text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5"
          >
            <span>Calibr</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white shadow-sm shadow-blue-500/30">
              8
            </span>
          </div>

          {/* <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#curriculum"
              className="hover:text-slate-900 transition-colors"
            >
              Curriculum
            </a>
          </nav> */}

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => setView("home")}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                {/* <button
                  onClick={() => handleOpenGetStarted("login")}
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  Sign In
                </button> */}
                <button
                  onClick={() => handleOpenGetStarted("register")}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3.5 py-1 text-xs font-medium text-blue-700">
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600" />
                Adaptive Practice · Calibrated Skill Ranks
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08]">
                Calibrate your growth with deliberate daily coding.
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
                One precision-targeted problem each day, matched to your 70%
                mastery boundary. Build verified skill ranks, deep intuition,
                and compounding daily consistency.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() =>
                    state.started
                      ? setView("home")
                      : handleOpenGetStarted("register")
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/35 transition cursor-pointer"
                >
                  {state.started ? "Continue Practicing" : "Get Started"}
                </button>

                {/* <button
                  onClick={() => {
                    const el = document.getElementById("how-it-works");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  See How It Works
                </button> */}
              </div>

              <div className="flex items-center gap-6 pt-4 text-xs text-slate-500 border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900">
                    70% Optimal Boundary
                  </span>
                  <p className="text-slate-500">Peak cognitive compounding</p>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="font-semibold text-slate-900">
                    Verified Ratings
                  </span>
                  <p className="text-slate-500">ELO rank across 8 topics</p>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="font-semibold text-slate-900">
                    Zero Fluff
                  </span>
                  <p className="text-slate-500">No memorization traps</p>
                </div>
              </div>
            </div>

            {/* Interactive Preview Card */}
            {/* <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800">
                      Today&apos;s Calibration Target
                    </span>
                  </div>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                    Sliding Window
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Longest Calm Window
                    </h3>
                    <span className="font-mono text-xs font-medium text-slate-500">
                      Level: Mid (1250 Rating)
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-white rounded-lg p-3 border border-slate-100">
                    Given numerical readings and maximum difference k, find the
                    length of the longest contiguous sub-array where max minus
                    min is at most k.
                  </p>

                  <div className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200 space-y-1">
                    <div className="text-slate-400">
                      // Sample input & target output
                    </div>
                    <div>readings = [4, 8, 5, 1, 7], k = 4</div>
                    <div className="text-emerald-400 font-semibold">
                      Output: 3
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <div className="text-[10px] text-slate-400 uppercase">
                        Target Streak
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        46 Days
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <div className="text-[10px] text-slate-400 uppercase">
                        Points
                      </div>
                      <div className="text-sm font-bold text-blue-600">
                        +25 pts
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <div className="text-[10px] text-slate-400 uppercase">
                        Verification
                      </div>
                      <div className="text-sm font-bold text-emerald-600">
                        Strict Run
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </section>
      {/* ─── How It Works (3 Steps) ───────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-t border-slate-100 bg-slate-50/70 py-20"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              The Calibration Process
            </h2>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              How Calibr8 builds verified problem-solving intuition.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 mb-4">
                01
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Initial Baseline Assessment
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose beginner mode or calibrate your familiarity across
                Arrays, Graphs, Sliding Window, DP, and Core topics in seconds.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 mb-4">
                02
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Daily Adaptive Challenge
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive exactly one curated question every morning, matched to
                your calibrated edge so you consistently learn new patterns.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 mb-4">
                03
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Compounding Mastery
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track your rating climbs, earn streak multipliers, and verify
                your problem-solving depth with dry runs and complexity checks.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* ─── Core Curriculum & Topics ─────────────────────────────────────── */}
      {/* <section id="curriculum" className="py-20 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                Curriculum Breadth
              </h2>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                Core tracks calibrated to interview standards.
              </p>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Each topic contains calibrated problem tiers ranging from foundational logic to production-grade algorithms.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Sliding Window", desc: "Dynamic and fixed windows, sub-arrays & queues", tier: "Mid / 1250" },
              { name: "Graphs & Trees", desc: "BFS, DFS, cycle detection & shortest path traversals", tier: "Hard / 1700" },
              { name: "Dynamic Programming", desc: "Subproblem optimal substructure and tabulation", tier: "Mid / 1250" },
              { name: "Arrays & Pointers", desc: "Two-pointer techniques, prefix sums, and binary search", tier: "Easy / 800" },
              { name: "Recursion & Backtracking", desc: "Tree traversals, permutations, and search bounds", tier: "Easy / 800" },
              { name: "Strings & Palindromes", desc: "Pattern matching, rolling hashes, and palindromes", tier: "Mid / 1250" },
              { name: "SQL & Databases", desc: "Window functions, aggregate groupings, and indexing", tier: "Mid / 1250" },
              { name: "Aptitude & Logic", desc: "Quantitative speed, logic puzzles, and probability", tier: "Easy / 800" },
            ].map((topic) => (
              <div
                key={topic.name}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">{topic.name}</h3>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {topic.tier}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{topic.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      {/* ─── Call to Action Banner ────────────────────────────────────────── */}
      {/* <section className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to calibrate your daily practice?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Take the quick 2-step setup to calibrate your baseline topic ratings and unlock today&apos;s adaptive challenge.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleOpenGetStarted("register")}
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition cursor-pointer"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section> */}
      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      {/* <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Calibr8</span>
            <span>·</span>
            <span>Deliberate daily growth</span>
          </div>
          <div className="flex items-center gap-6">
            <span>© {new Date().getFullYear()} Calibr8. All rights reserved.</span>
          </div>
        </div>
      </footer> */}
      {/* ─── Get Started Modal (2 Phases / Screens) ───────────────────────── */}
      {isGetStartedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
            {/* Close button */}
            <button
              onClick={() => setIsGetStartedOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              ✕
            </button>

            {/* ─── Screen 1: Register / Login Option with Skip ─────────── */}
            {modalStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {authMode === "register"
                      ? "Create Your Account"
                      : "Welcome Back"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {authMode === "register"
                      ? "Save your calibrated ratings, streaks, and solve history."
                      : "Sign in to access your calibrated topics and daily streaks."}
                  </p>
                </div>

                {/* Switcher */}
                <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError("");
                    }}
                    className={`flex-1 rounded-md py-1.5 transition cursor-pointer ${
                      authMode === "register"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                    }}
                    className={`flex-1 rounded-md py-1.5 transition cursor-pointer ${
                      authMode === "login"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                {authError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-600">
                    {authError}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmitAuth} className="space-y-3">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingAuth
                      ? "Processing..."
                      : authMode === "register"
                        ? "Create Account & Continue"
                        : "Sign In & Continue"}
                  </button>
                </form>

                {/* Skip option */}
                <div className="text-center pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSkipAuth}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium underline underline-offset-2 transition cursor-pointer"
                  >
                    Skip for now (Continue as Guest) →
                  </button>
                </div>
              </div>
            )}

            {/* ─── Screen 2: Choose Beginner vs Set Level as per Knowledge */}
            {modalStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Calibrate Your Starting Level
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your familiarity to customize your daily question
                    difficulty.
                  </p>
                </div>

                {/* Option Tabs / Cards */}
                <div className="space-y-3">
                  <div
                    onClick={() => setCalibrationMode("beginner")}
                    className={`rounded-xl border p-4 cursor-pointer transition ${
                      calibrationMode === "beginner"
                        ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="calibrationMode"
                          checked={calibrationMode === "beginner"}
                          onChange={() => setCalibrationMode("beginner")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-slate-900">
                          I am a Beginner
                        </span>
                      </div>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        800 Rating
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 pl-6">
                      Initializes all topics to Level 1 (Easy). Perfect for
                      learning core algorithmic techniques from the ground up.
                    </p>
                  </div>

                  <div
                    onClick={() => setCalibrationMode("custom")}
                    className={`rounded-xl border p-4 cursor-pointer transition ${
                      calibrationMode === "custom"
                        ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="calibrationMode"
                          checked={calibrationMode === "custom"}
                          onChange={() => setCalibrationMode("custom")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-slate-900">
                          Set level as per my knowledge
                        </span>
                      </div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        Custom
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 pl-6">
                      Customize your level topic by topic (Easy, Mid, Hard)
                      based on your existing problem-solving experience.
                    </p>
                  </div>
                </div>

                {/* If Custom chosen, show topic level controls */}
                {calibrationMode === "custom" && (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-medium text-slate-600 mb-1">
                      Set target level for each topic:
                    </p>
                    {ALL_TOPICS.map((topic) => {
                      const currentLvl = customLevels[topic] ?? 0;
                      return (
                        <div
                          key={topic}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs"
                        >
                          <span className="font-medium text-slate-800">
                            {topic}
                          </span>
                          <div className="flex items-center gap-1">
                            {["Easy", "Mid", "Hard"].map((label, idx) => (
                              <button
                                key={label}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomLevels((prev) => ({
                                    ...prev,
                                    [topic]: idx,
                                  }));
                                }}
                                className={`rounded px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                                  currentLvl === idx
                                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                                    : "bg-white text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Complete Button */}
                <button
                  type="button"
                  disabled={isSavingCalibration}
                  onClick={() => handleCompleteCalibration(calibrationMode)}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSavingCalibration
                    ? "Calibrating..."
                    : "Save Calibration & Start Practice"}
                </button>
              </div>
            )}

            {/* ─── Bottom of both pages: 2 Small Dots ──────────────────── */}
            {/* If user is on 1st page make the first one grey and if on 2nd make both grey */}
            <div className="mt-6 flex items-center justify-center gap-2 pt-2">
              <div
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  modalStep === 1 ? "bg-slate-700" : "bg-slate-700"
                }`}
                title="Step 1"
              />
              <div
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  modalStep === 1 ? "bg-slate-200" : "bg-slate-700"
                }`}
                title="Step 2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
