import { useRef } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

export function LandingView() {
  const {
    state,
    setView,
    toggleThemeMode,
    setAuthModalOpen,
    setAuthMode,
  } = useCalibr8();
  const heroRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    heroRef.current.style.setProperty("--x", `${e.clientX - rect.left}px`);
    heroRef.current.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const handleStart = () => {
    if (state.started) {
      setView("home");
    } else {
      setAuthMode("register");
      setAuthModalOpen(true);
    }
  };

  const handleOpenLogin = () => {
    setAuthMode("login");
    setAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthMode("register");
    setAuthModalOpen(true);
  };

  return (
    <>
      <div
        className="hero"
        ref={heroRef}
        onPointerMove={handlePointerMove}
      >
        <div className="orb" />
        <div className="lnav">
          <div className="logo" onClick={() => setView("landing")}>
            Calibr<b>8</b>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              id="th"
              onClick={toggleThemeMode}
              title="Toggle dark/light"
            >
              {state.mode === "light" ? "🌙" : "☀️"}
            </button>
            <button
              className="btn ghost"
              onClick={handleOpenLogin}
            >
              Sign In
            </button>
            <button
              className="btn"
              onClick={handleOpenRegister}
            >
              Register
            </button>
            <button
              className="btn ghost"
              onClick={() => setView("home")}
            >
              Explore a demo
            </button>
          </div>
        </div>

        <h1>
          calibrate<br />
          your growth
        </h1>

        <div className="sub">
          One question a day, picked for your exact level. Small steps, steady compounding, real verified progress.
        </div>

        <div className="pick" style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn" onClick={handleStart}>
            {state.started ? "Continue Practicing" : "Get Started (Register Free)"}
          </button>
          <button className="btn ghost" onClick={handleOpenLogin}>
            Sign In
          </button>
        </div>

        <div className="fl f1">
          <b>19</b>Languages
        </div>
        <div className="fl f2">
          <b>1.5×</b>Points in strict mode
        </div>
        <div className="fl f3">
          <b>5,000</b>Questions in bank
        </div>
      </div>

      <section className="how">
        <h2>How it works</h2>
        <div className="grid s3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="card step">
            <b>1</b>
            <h3>Calibrate your level</h3>
            <p className="mu">
              Pick your known topics. Calibr8 starts with diagnostic questions to estimate your rating.
            </p>
          </div>

          <div className="card step">
            <b>2</b>
            <h3>One daily question</h3>
            <p className="mu">
              No endless lists. You get one question targeted right at your frontier — hard enough to learn, easy enough to finish.
            </p>
          </div>

          <div className="card step">
            <b>3</b>
            <h3>Strict-mode verification</h3>
            <p className="mu">
              Fullscreen, timed, zero hints. Submissions are verified and ranked on college and global leaderboards.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
