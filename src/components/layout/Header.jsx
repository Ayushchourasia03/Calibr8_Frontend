import { useCalibr8 } from "../../context/Calibr8Context";

export function Header() {
  const {
    state,
    setView,
    setActiveModal,
    setModalData,
    toggleThemeMode,
    tierInfo,
    showToast,
  } = useCalibr8();

  if (state.view === "landing") return null;

  const handleStatClick = (statKey) => {
    setActiveModal("stat");
    setModalData({ statKey });
  };

  const handleDailyClick = () => {
    if (state.att?.mode === "strict" && state.att?.active) {
      showToast("Finish or abandon the strict attempt first.");
      return;
    }
    if (state.dailyDone || !state.daily) {
      setView("home");
    } else {
      setView("solve");
    }
  };

  const handleSearch = (e) => {
    if (state.att?.mode === "strict" && state.att?.active) {
      e.target.value = "";
      showToast("Strict attempt active - search disabled.");
      return;
    }
    setView("problems");
  };

  const accountLabel = state.user
    ? state.user.guest
      ? "Guest"
      : state.user.name || state.user.email?.split("@")[0] || "Account"
    : "Guest";

  return (
    <header>
      <div className="logo" onClick={() => setView("landing")}>
        Calibr<b>8</b>
      </div>

      <nav id="nav">
        <button
          className={state.view === "home" ? "on" : ""}
          onClick={() => setView("home")}
        >
          Today
        </button>
        <button
          className={state.view === "solve" ? "on" : ""}
          onClick={() => setView("solve")}
        >
          Solve
        </button>
      </nav>

      <div className="hx">
        <button
          className={`btn ${state.dailyDone ? "done" : ""}`}
          id="dq"
          onClick={handleDailyClick}
        >
          {state.dailyDone ? "Daily ✓" : "Daily"}
        </button>
        <input
          id="q"
          type="search"
          placeholder="Search 5,000 questions"
          onFocus={() => {
            if (state.view !== "problems") setView("problems");
          }}
          onChange={handleSearch}
        />
        <button
          id="th"
          onClick={toggleThemeMode}
          title="Toggle dark/light"
        >
          {state.mode === "light" ? "🌙" : "☀️"}
        </button>
        <button
          className="btn ghost"
          id="acct"
          onClick={() => {
            setModalData({ step: state.user && !state.user.guest ? 1 : 0 });
            setActiveModal("onboarding");
          }}
        >
          {accountLabel}
        </button>
      </div>

      <div className="stats">
        <span className="stbtn" onClick={() => setActiveModal("tier")}>
          Tier <b id="sTier">{state.calibrating ? "Calibrating" : tierInfo.full}</b>
        </span>
        <span className="stbtn" onClick={() => handleStatClick("rating")}>
          Rating <b id="sRate">{state.rating || 1630}</b>
        </span>
        <span className="stbtn" onClick={() => handleStatClick("streak")}>
          Streak <b id="sStreak">{state.streak || 46}</b>
        </span>
        <span className="stbtn" onClick={() => handleStatClick("coins")}>
          Coins <b id="sCoins">{state.coins || 340}</b>
        </span>
      </div>
    </header>
  );
}
