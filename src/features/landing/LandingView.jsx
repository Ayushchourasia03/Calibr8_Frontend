import { useRef } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

export function LandingView() {
  const {
    setView,
    setActiveModal,
    setModalData,
    exploreDemo,
  } = useCalibr8();
  const heroRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    heroRef.current.style.setProperty("--x", `${e.clientX - rect.left}px`);
    heroRef.current.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const handleStart = () => {
    setModalData({ step: 0, authMode: "login" });
    setActiveModal("onboarding");
  };

  const handleExploreDemo = () => {
    exploreDemo();
  };

  return (
    <div className="landing-wrapper">
      {/* Hero Section */}
      <div
        className="landing-hero"
        ref={heroRef}
        onPointerMove={handlePointerMove}
      >
        {/* Cursor-following atmospheric purple orb */}
        <div className="landing-orb" />

        {/* Top Header - ONLY Calibr8 logo and Explore a demo button */}
        <header className="landing-top-nav">
          <div className="landing-logo" onClick={() => setView("landing")}>
            Calibr8
          </div>
          <button
            type="button"
            className="landing-demo-btn"
            onClick={handleExploreDemo}
          >
            Explore a demo
          </button>
        </header>

        {/* Floating stat top-right: 19 languages */}
        <div className="landing-stat stat-languages">
          <span className="stat-value">19</span>
          <span className="stat-desc">languages</span>
        </div>

        {/* Hero Main Content */}
        <div className="landing-hero-content">
          <h1 className="landing-title">
            calibrate<br />
            your growth
          </h1>

          <p className="landing-subtitle">
            One question a day, picked for your level.<br />
            Small steps, real progress.
          </p>

          <button
            type="button"
            className="landing-start-btn"
            onClick={handleStart}
          >
            Start
          </button>
        </div>

        {/* Floating stat mid-right: 1.5x points in strict mode */}
        <div className="landing-stat stat-strict">
          <span className="stat-value">1.5x</span>
          <span className="stat-desc">points in strict mode</span>
        </div>

        {/* Floating stat bottom-left: 1 question a day */}
        <div className="landing-stat stat-daily">
          <span className="stat-value">1</span>
          <span className="stat-desc">question a day, just for you</span>
        </div>
      </div>

      {/* Lower Sections (Matching requirement images 5 and 6) */}
      <div className="landing-lower-content">
        {/* Section 1: How it works */}
        <section className="landing-section">
          <h2 className="landing-section-title">How it works</h2>
          <div className="landing-grid-2x2">
            <div className="landing-card">
              <div className="card-step-badge">1</div>
              <h3 className="card-title">Tell us your level</h3>
              <p className="card-desc">
                Pick a level for each topic. No entry test. We learn your real level over the first 10 to 15 days.
              </p>
            </div>

            <div className="landing-card">
              <div className="card-step-badge">2</div>
              <h3 className="card-title">One question a day</h3>
              <p className="card-desc">
                Chosen for you, about a 70% chance you can solve it. Stretch questions if you want more.
              </p>
            </div>

            <div className="landing-card">
              <div className="card-step-badge">3</div>
              <h3 className="card-title">Learn the idea</h3>
              <p className="card-desc">
                Concept videos, hints, a dry run and notes teach the thinking, not just the answer.
              </p>
            </div>

            <div className="landing-card">
              <div className="card-step-badge">4</div>
              <h3 className="card-title">Rank honestly</h3>
              <p className="card-desc">
                Strict mode proves your solves, so college and national ranks mean something.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Concept videos */}
        <section className="landing-section">
          <h2 className="landing-section-title">Concept videos</h2>
          <div className="landing-grid-2col">
            <div className="landing-video-preview">
              <div className="clapper-icon" aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.2 6 3 11l-.9-2.4c-.4-1.1.2-2.4 1.3-2.8l13.6-5c1.1-.4 2.4.2 2.8 1.3l.4 1.9Z"/>
                  <path d="m6.2 5.3 3.1 4"/>
                  <path d="m12.2 3.1 3.1 4"/>
                  <path d="M3 11h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11Z"/>
                </svg>
              </div>
              <span className="video-preview-label">Before a big topic shift</span>
            </div>

            <div className="landing-card landing-card-padded">
              <h3 className="card-title">Learn it from a person</h3>
              <p className="card-desc">
                Short videos made by the founder explain the concept and the thought process. Watch at 1x, 1.25x or 1.5x. No skipping. A quick understanding check earns your completion tag.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Relaxed or strict */}
        <section className="landing-section">
          <h2 className="landing-section-title">Relaxed or strict</h2>
          <div className="landing-grid-2col">
            <div className="landing-card">
              <h3 className="card-title">Relaxed, 1.0x</h3>
              <p className="card-desc">
                Hints, dry run, notes and paste allowed. Built for learning.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">Strict, 1.5x</h3>
              <p className="card-desc">
                Fullscreen, no paste, no help, no tab switching. Built for proof.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Ready when you are */}
        <section className="landing-ready-section">
          <h2 className="landing-ready-title">Ready when you are</h2>
          <button
            type="button"
            className="landing-start-btn"
            onClick={handleStart}
          >
            Start
          </button>
        </section>
      </div>
    </div>
  );
}

export default LandingView;
