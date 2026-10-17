import { useRef } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

export function LandingView() {
  const {
    state,
    setView,
    setLevelModalOpen,
    user,
    login,
    setAuthModalOpen,
    setAuthMode
  } = useCalibr8();

  const heroRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    heroRef.current.style.setProperty("--x", `${e.clientX - rect.left}px`);
    heroRef.current.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const handleDemoSignIn = async () => {
    try {
      await login({ email: "jane@example.com", password: "password123" });
      setView("home");
    } catch {
      setView("home");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-slate-100">
      <section
        ref={heroRef}
        onPointerMove={handlePointerMove}
        className="relative flex min-h-screen flex-col justify-center px-8 md:px-20 overflow-hidden"
        style={{ "--x": "60%", "--y": "40%" }}
      >
        <div
          className="pointer-events-none absolute h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl transition-all duration-700 ease-out"
          style={{
            left: "var(--x)",
            top: "var(--y)",
            background:
              "conic-gradient(from 180deg, #1b63ff, #00d2ff, #2f8bff, #1b63ff)",
          }}
        />

        <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-10">
          <div className="text-2xl font-bold font-serif tracking-tight text-white">
            Calibr<span className="text-blue-500">8</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => setView("home")}
                className="rounded-full border border-blue-400/40 bg-blue-500/20 px-4 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-blue-500/30"
              >
                Go to Dashboard ({user.name})
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthModalOpen(true);
                  }}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
                >
                  Sign In
                </button>
                <button
                  onClick={handleDemoSignIn}
                  className="rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-blue-500/20"
                >
                  Explore Demo Account
                </button>
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl md:text-8xl font-light tracking-tighter leading-[0.95] mb-4">
            calibrate <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
              your growth
            </span>
          </h1>
          <p className="max-w-md text-base text-slate-300 mb-8">
            One curated question a day targeted at your exact level. Small
            steps, steady compounding, verified mastery.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                state.started ? setView("home") : setLevelModalOpen(true)
              }
              className="rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition"
            >
              {state.started ? "Continue Practicing" : "Get Started Daily"}
            </button>
          </div>
        </div>

        <div className="hidden lg:block absolute right-16 top-1/4 text-center">
          <span className="text-4xl font-light text-white block">19</span>
          <span className="text-xs text-slate-400">Languages</span>
        </div>
        <div className="hidden lg:block absolute right-32 bottom-1/4 text-center">
          <span className="text-4xl font-light text-cyan-400 block">1.5x</span>
          <span className="text-xs text-slate-400">Strict mode score</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-8 py-20 border-t border-slate-800/80">
        <h2 className="text-2xl md:text-3xl font-light mb-8">
          Deliberate Practice, Built-In.
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-500/20 bg-slate-900/40 p-6 backdrop-blur">
            <h3 className="text-lg font-medium text-white mb-2">
              The Right Question
            </h3>
            <p className="text-xs text-slate-400">
              Never random. Picked to give you an optimal 70% success boundary
              so you learn a new idea every day.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-slate-900/40 p-6 backdrop-blur">
            <h3 className="text-lg font-medium text-white mb-2">
              Verified Ranks
            </h3>
            <p className="text-xs text-slate-400">
              Strict-mode runs enforce fullscreen and prevent copy-pasting so
              college rankings have genuine merit.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-slate-900/40 p-6 backdrop-blur">
            <h3 className="text-lg font-medium text-white mb-2">
              Insight Over Answers
            </h3>
            <p className="text-xs text-slate-400">
              Dry run visualizations, graduated hints, and algorithmic
              complexity quizzes enforce true comprehension.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
