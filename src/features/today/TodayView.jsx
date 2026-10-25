import { useMemo } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { VOCABULARY_WORDS } from "../../data/vocabularyData";
import { todayKey, ymd } from "../../utils/tierUtils";
import { DIFFICULTY_LABELS } from "../../data/constants";

export function TodayView() {
  const {
    state,
    setState,
    setView,
    setActiveModal,
    setModalData,
    tierInfo,
    setCurrentQ,
    createQuestion,
    getTopicRating,
    showToast,
  } = useCalibr8();

  const now = useMemo(() => new Date(), []);
  const h = now.getHours();
  const greeting =
    h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const st = state.streak || 0;
  const milestones = [7, 14, 30, 60, 100, 365];
  const nextMilestone = milestones.find((x) => x > st) || 365;

  const currentWordIndex = (state.dayStamp || 0) % VOCABULARY_WORDS.length;
  const word = VOCABULARY_WORDS[currentWordIndex];
  const isWordLearned = state.wordDay === todayKey();

  // Monthly calendar generator
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const activity = state.activity || {};
  const dailyDoneMap = state.dd || {};

  let completedDaysCount = 0;
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ empty: true, key: `empty_${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const k = ymd(year, month, d);
    const count = activity[k] || 0;
    const isDailyDoneOnDate = dailyDoneMap[k];
    if (isDailyDoneOnDate) completedDaysCount++;
    calendarDays.push({
      day: d,
      key: k,
      count,
      isDailyDone: isDailyDoneOnDate,
      isToday: d === now.getDate(),
    });
  }

  // Active question
  const dailyQ = state.daily || createQuestion(false);
  const stretchQ = state.stretch || createQuestion(true);

  const handleOpenDaily = () => {
    setCurrentQ(dailyQ);
    setState((s) => ({ ...s, att: null }));
    setView("solve");
  };

  const handleOpenStretch = () => {
    setCurrentQ(stretchQ);
    setState((s) => ({ ...s, att: null }));
    setView("solve");
  };

  const handleLearnWord = () => {
    if (!isWordLearned) {
      setState((s) => ({
        ...s,
        wordDay: todayKey(),
        wordsLearned: (s.wordsLearned || 0) + 1,
      }));
      showToast(`Word learned: ${word[0]}!`);
    }
  };

  const L = state.levels || {};
  const topics = Object.keys(L);

  const getTopicStatus = (t) => {
    const r = getTopicRating(t);
    const base = [800, 1200, 1600][L[t] || 0];
    const diff = r - base;
    if (diff >= 50) return { label: "Good", color: "ok" };
    if (diff <= -50) return { label: "Weak", color: "bad" };
    return { label: "Better", color: "mu" };
  };

  // Weekdays for current week streak
  const dayOfWeek = now.getDay(); // 0 is Sun
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
        <h1>
          {greeting},{" "}
          {state.name || (state.user && !state.user.guest ? state.user.email?.split("@")[0] : "Learner")}
        </h1>
        <div className="mu">
          Today: <b>{now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</b>
        </div>
      </div>

      <div className="tdy">
        {/* Card 1: Daily Calibration Question */}
        <div className="card dq">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Daily Calibration</h2>
            {state.dailyDone ? (
              <span className="tag" style={{ background: "rgba(46, 212, 122, 0.15)", color: "#2ED47A" }}>
                Completed Today ✓
              </span>
            ) : (
              <span className="tag strict">Strict Mode Recommended</span>
            )}
          </div>

          <p className="mu" style={{ margin: "6px 0 12px" }}>
            Targeted at your current frontier in <b>{dailyQ.topic}</b>. Complete in strict mode for 1.5× score multiplier.
          </p>

          <div style={{ padding: "12px", background: "var(--cf)", borderRadius: "12px", marginBottom: "14px", border: "1px solid var(--ln)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <b style={{ fontSize: "16px" }}>{dailyQ.title}</b>
              <span className={`dc d${["E", "M", "H"][dailyQ.difficulty]}`}>
                {DIFFICULTY_LABELS[dailyQ.difficulty]}
              </span>
            </div>
            <p className="mu" style={{ margin: 0, fontSize: "13px" }}>
              {dailyQ.text}
            </p>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="mu">
              Reward: <b>{dailyQ.pts} Base Pts</b> ({Math.round(dailyQ.pts * 1.5)} in strict)
            </div>
            <button className="btn" onClick={handleOpenDaily}>
              {state.dailyDone ? "Review Solution" : "Start Today's Question →"}
            </button>
          </div>
        </div>

        {/* Card 2: Skill Calibration / Topics */}
        <div className="card mc">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
            <h2>Your Calibration</h2>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="btn ghost"
                style={{ fontSize: "12px", padding: "4px 8px" }}
                onClick={() => {
                  setModalData({ step: 1 });
                  setActiveModal("onboarding");
                }}
              >
                Change topics
              </button>
              <button
                className="btn ghost"
                style={{ fontSize: "12px", padding: "4px 10px" }}
                onClick={() => setActiveModal("tier")}
              >
                Info
              </button>
            </div>
          </div>

          <div className="gauge">
            <i style={{ left: `${tierInfo.pct}%` }} />
          </div>
          <div className="tiers">
            <span>Bronze</span>
            <span>Silver</span>
            <span>Gold</span>
            <span>Diamond</span>
            <span>Master</span>
          </div>

          <div style={{ marginTop: "14px" }}>
            {topics.map((t) => {
              const r = getTopicRating(t);
              const status = getTopicStatus(t);
              return (
                <div key={t} className="tr">
                  <div>
                    <b>{t}</b>
                    <span className="mu" style={{ marginLeft: "6px" }}>
                      Lv.{L[t] + 1}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={status.color} style={{ fontSize: "12px", fontWeight: 600 }}>
                      {status.label}
                    </span>
                    <b>{r}</b>
                    <button
                      className="btn ghost"
                      style={{ padding: "2px 8px", fontSize: "11px" }}
                      onClick={() => {
                        setActiveModal("level");
                        setModalData({ topic: t });
                      }}
                    >
                      Calibrate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Streak Tracker */}
        <div className="card streakc">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span className="flame">🔥</span>
              <div className="big">{st}</div>
              <div className="mu">Day Streak Active</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mu">Next Milestone</div>
              <b>{nextMilestone} Days</b>
            </div>
          </div>

          <div className="week" style={{ marginTop: "12px" }}>
            {weekDays.map((label, idx) => {
              const isPastOrToday = idx <= dayOfWeek;
              const isToday = idx === dayOfWeek;
              return (
                <div
                  key={idx}
                  className={`wd ${isPastOrToday ? "on" : ""} ${isToday ? "now" : ""}`}
                >
                  <i>{label}</i>
                  <span>{isPastOrToday ? "✓" : "•"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: Stretch Target */}
        <div className="card">
          <h2>Stretch Target</h2>
          <p className="mu" style={{ margin: "4px 0 10px" }}>
            An extra question 1 tier higher to accelerate your rating.
          </p>

          <div style={{ padding: "10px", background: "var(--cf)", borderRadius: "10px", marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>{stretchQ.title}</b>
              <span className={`dc d${["E", "M", "H"][stretchQ.difficulty]}`}>
                {DIFFICULTY_LABELS[stretchQ.difficulty]}
              </span>
            </div>
            <div className="mu" style={{ fontSize: "12px", marginTop: "4px" }}>
              Topic: {stretchQ.topic} • {stretchQ.pts} Base Pts
            </div>
          </div>

          <button className="btn ghost" style={{ width: "100%" }} onClick={handleOpenStretch}>
            Solve Stretch Question →
          </button>
        </div>

        {/* Card 5: Word of the Day */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Word of the Day</h2>
            <span className="tag">Vocabulary</span>
          </div>

          <div className="word">{word[0]}</div>
          <div className="mu" style={{ fontStyle: "italic", marginBottom: "6px" }}>
            "{word[1]}"
          </div>
          <p className="mu" style={{ fontSize: "13px", margin: "6px 0 12px" }}>
            {word[2]}
          </p>

          <button
            className={`btn ${isWordLearned ? "ghost" : ""}`}
            style={{ width: "100%" }}
            onClick={handleLearnWord}
          >
            {isWordLearned ? "Learned for Today ✓" : "Mark as Learned (+10 Coins)"}
          </button>
        </div>

        {/* Card 6: Monthly Activity Calendar */}
        <div className="card wide">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h2>
              {now.toLocaleString("en-US", { month: "long" })} Practice Heatmap
            </h2>
            <div className="mu">
              <b>{completedDaysCount}</b> active days this month
            </div>
          </div>

          <div className="cal">
            <b>Sun</b>
            <b>Mon</b>
            <b>Tue</b>
            <b>Wed</b>
            <b>Thu</b>
            <b>Fri</b>
            <b>Sat</b>

            {calendarDays.map((item) => {
              if (item.empty) {
                return <i key={item.key} style={{ opacity: 0 }} />;
              }

              let levelClass = "";
              if (item.count >= 3) levelClass = "l3";
              else if (item.count === 2) levelClass = "l2";
              else if (item.count === 1) levelClass = "l1";

              const extraClasses = [
                levelClass,
                item.isDailyDone ? "dd" : "",
                item.isToday ? "td" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <i
                  key={item.key}
                  className={extraClasses}
                  title={`${item.key}: ${item.count} submissions`}
                >
                  {item.day}
                </i>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
