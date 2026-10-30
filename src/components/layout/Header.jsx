import { useState, useRef, useEffect } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

export function Header() {
  const {
    state,
    setState,
    setView,
    setActiveModal,
    setModalData,
    toggleThemeMode,
    tierInfo,
    showToast,
    setCurrentQ,
    createQuestion,
    logout,
  } = useCalibr8();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const acctRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        acctRef.current &&
        !acctRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  if (state.view === "landing") return null;

  const handleStatClick = (statKey) => {
    setActiveModal("stat");
    setModalData({ statKey });
  };

  const handleTierClick = () => {
    setActiveModal("tier");
  };

  const handleDailyClick = () => {
    if (state.att?.mode === "strict" && state.att?.active) {
      showToast("Finish or abandon the strict attempt first.");
      return;
    }
    if (state.dailyDone || !state.daily) {
      setView("home");
    } else {
      const q = state.daily || createQuestion(false);
      setCurrentQ(q);
      setView("solve");
    }
  };

  const handleSearchChange = (e) => {
    if (state.att?.mode === "strict" && state.att?.active) {
      e.target.value = "";
      showToast("Strict attempt active - search disabled.");
      return;
    }
    const val = e.target.value;
    setState((s) => ({ ...s, searchQuery: val }));
    if (state.view !== "problems") {
      setView("problems");
    }
  };

  const userName =
    state.name ||
    (state.user && !state.user.guest
      ? state.user.email?.split("@")[0]
      : "Guest");
  const isSignedIn = Boolean(state.user && !state.user.guest);
  const headerStats = state.headerStats;
  const tierLabel = state.calibrating
    ? "Calibrating"
    : headerStats?.tier || (isSignedIn ? "—" : tierInfo.full);
  const scoreLabel =
    isSignedIn && !headerStats
      ? "—"
      : Math.floor((state.score || 0) / 10).toLocaleString();
  const coinsLabel =
    isSignedIn && !headerStats ? "—" : state.coins || 0;
  const streakLabel =
    isSignedIn && !headerStats ? "—" : state.streak || 0;

  return (
    <header>
      <div
        className="logo"
        onClick={() => {
          if (state.att?.mode === "strict" && state.att?.active) {
            showToast("Finish or abandon the strict attempt first.");
            return;
          }
          setView("landing");
        }}
        title="Back to start page"
      >
        Calibr<b>8</b>
      </div>

      <nav id="nav" style={{ display: "none" }} />

      <div className="hx">
        <input
          id="q"
          type="search"
          placeholder="Search 5,000 questions"
          aria-label="Search questions"
          onFocus={() => {
            if (state.view !== "problems") setView("problems");
          }}
          onChange={handleSearchChange}
        />

        <button
          className={`btn ${state.dailyDone ? "done" : ""}`}
          id="dq"
          onClick={handleDailyClick}
        >
          {state.dailyDone ? "Daily ✓" : "Daily"}
        </button>

        <div className="stats">
          <span className="stbtn" onClick={handleTierClick}>
            Tier{" "}
            <b id="sTier">{tierLabel}</b>
          </span>
          <span className="stbtn" onClick={() => handleStatClick("score")}>
            Score <b id="sScore">{scoreLabel}</b>
          </span>
          <span className="stbtn" onClick={() => handleStatClick("coins")}>
            Coins <b id="sCoins">{coinsLabel}</b>
          </span>
          <span className="stbtn" onClick={() => handleStatClick("streak")}>
            Streak <b id="sStreak">{streakLabel}d</b>
          </span>
        </div>

        <button
          id="th"
          onClick={toggleThemeMode}
          aria-label="Switch between dark and light mode"
          title="Toggle dark/light mode"
        >
          {state.mode === "light" ? "🌙" : "☀️"}
        </button>

        <button
          className="btn ghost"
          id="acct"
          ref={acctRef}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Account"
          title="Account menu"
        >
          {state.avatar || "🙂"}
        </button>
      </div>

      {menuOpen && (
        <div id="amenu" ref={menuRef}>
          <div className="mh">
            <span className="av sm">{state.avatar || "🙂"}</span>
            <div>
              <b>{userName}</b>
              <br />
              <span className="mu">
                {state.user
                  ? state.user.guest
                    ? "Guest on this device"
                    : state.user.email
                  : "Not signed in"}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleStatClick("score");
            }}
          >
            Score <b>{scoreLabel}</b>
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleTierClick();
            }}
          >
            Tier{" "}
            <b>
              {tierLabel}
            </b>
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              setView("me");
            }}
          >
            Profile
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              setActiveModal("onboarding");
              setModalData({ step: 1 });
            }}
          >
            Edit setup
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              setActiveModal("onboarding");
              setModalData({ step: 0 });
            }}
          >
            {state.user && !state.user.guest ? "Switch account" : "Log in"}
          </button>
          {state.user && !state.user.guest && (
            <button
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
            >
              Log out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
