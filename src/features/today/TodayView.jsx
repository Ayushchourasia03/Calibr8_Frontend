import { useMemo } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { VOCABULARY_WORDS } from "../../data/vocabularyData";
import { todayKey, ymd, ShieldBadge } from "../../utils/tierUtils";
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
  const word = VOCABULARY_WORDS[currentWordIndex] || [
    "ubiquitous",
    "adj.",
    "present or found everywhere",
    "Smartphones are ubiquitous on campus.",
  ];
  const isWordLearned = state.wordDay === todayKey();

  // Monthly calendar generator
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const activity = state.activity || {};
  const dailyDoneMap = state.dd || {};

  let completedDaysCount = 0;
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<span key={`empty_${i}`} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const k = ymd(year, month, d);
    const count = activity[k] || 0;
    const isDailyDoneOnDate = dailyDoneMap[k];
    if (isDailyDoneOnDate) completedDaysCount++;

    const levelClass =
      count >= 4 ? "l3" : count >= 2 ? "l2" : count >= 1 ? "l1" : "";
    const isToday = d === now.getDate();

    calendarCells.push(
      <i
        key={k}
        className={`${levelClass} ${isDailyDoneOnDate ? "dd" : ""} ${
          isToday ? "td" : ""
        }`.trim()}
        title={`${k}: ${count} submission(s)${
          isDailyDoneOnDate ? ", daily done" : ""
        }`}
      >
        {d}
      </i>
    );
  }

  // Week days for streak card: 6, 5, 4, 3, 2, 1, 0 days ago
  const weekDayLetters = "SMTWTFS";
  const weekDays = [6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
    const dateOnDay = new Date(now.getTime() - daysAgo * 864e5);
    const letter = weekDayLetters[dateOnDay.getDay()];
    const isOn = state.dailyDone
      ? daysAgo < st
      : daysAgo >= 1 && daysAgo <= st;
    const isNow = daysAgo === 0 && !state.dailyDone;

    return (
      <div
        key={daysAgo}
        className={`wd ${isOn ? "on" : ""} ${isNow ? "now" : ""}`}
      >
        <i>{isOn ? "🔥" : ""}</i>
        {letter}
      </div>
    );
  });

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

  const rv = state.revise || [];

  return (
    <div>
      <h1 style={{ marginBottom: "2px" }}>{greeting}</h1>
      <p className="mu">
        {state.dailyDone
          ? "Daily question done. Stretch questions are open."
          : "Your daily question is ready."}
      </p>

      <div className="tdy">
        {/* Daily question card */}
        <section className="card dq" id="dcard">
          <h2>Daily question</h2>
          {state.dailyDone ? (
            <>
              <p className="ok">
                <b>Done for today ✓</b>
              </p>
              <h3>Stretch: {stretchQ.title}</h3>
              <p className="mu">
                Appears after the daily question. Solve one and the next appears. Failing costs nothing.
              </p>
              <button className="btn" id="st" onClick={handleOpenStretch}>
                Take it
              </button>
            </>
          ) : (
            <>
              <p>
                <b style={{ fontSize: "20px" }}>{dailyQ.title}</b>
              </p>
              <p>
                <span className="tag">{dailyQ.topic}</span>{" "}
                <span className="tag">
                  {DIFFICULTY_LABELS[dailyQ.difficulty ?? dailyQ.l ?? 1]}
                </span>
              </p>
              <p className="mu">
                Chosen for your {dailyQ.topic} rating, about a 70% chance you can solve it. Daily and stretch questions are always strict: fullscreen, no paste, no help. Worth {dailyQ.pts} points, {dailyQ.pts * 1.5} in strict mode.
              </p>
              <button className="btn" id="go" onClick={handleOpenDaily}>
                Open question
              </button>
            </>
          )}
        </section>

        {/* Monthly calendar */}
        <section className="card mc">
          <h2>
            {now.toLocaleString("en-US", { month: "long" })} {year}
          </h2>
          <div className="cal">
            <b>S</b>
            <b>M</b>
            <b>T</b>
            <b>W</b>
            <b>T</b>
            <b>F</b>
            <b>S</b>
            {calendarCells}
          </div>
          <p className="mu">
            Daily question done on {completedDaysCount} day(s) this month. Ring = daily done, colour = submissions.
          </p>
        </section>

        {/* Streak card */}
        <section
          className="card streakc"
          id="stk"
          style={{ cursor: "pointer" }}
          onClick={() => {
            setActiveModal("stat");
            setModalData({ statKey: "streak" });
          }}
        >
          <h2>Streak</h2>
          <div
            className="row"
            style={{ alignItems: "center", gap: "14px", margin: 0 }}
          >
            <span className="flame">🔥</span>
            <div>
              <div className="big">{st}</div>
              <div className="mu">
                day streak, best {Math.max(state.longest || 0, st)}
              </div>
            </div>
          </div>
          <div className="week">{weekDays}</div>
          <div className="bar">
            <i
              style={{
                width: `${Math.min(100, (st / nextMilestone) * 100)}%`,
                background: "linear-gradient(90deg,#FF9F43,#FF4F7A)",
              }}
            />
          </div>
          <p className="mu">
            {nextMilestone - st} more day(s) to the {nextMilestone}-day milestone.
          </p>
        </section>

        {/* Tier card */}
        <section
          className="card tierc"
          id="trc"
          style={{ cursor: "pointer" }}
          onClick={() => setActiveModal("tier")}
        >
          <h2>Tier</h2>
          <div
            className="row"
            style={{ alignItems: "center", gap: "14px", margin: 0 }}
          >
            <ShieldBadge
              tierIndex={tierInfo.i}
              divisionIndex={tierInfo.dv}
              size={76}
              calibrating={state.calibrating}
            />
            <div>
              <div className="big" style={{ fontSize: "30px" }}>
                {state.calibrating ? "Calibrating" : tierInfo.full}
              </div>
              <div className="mu">Rating {tierInfo.R || state.rating}</div>
            </div>
          </div>
          <div className="bar" style={{ margin: "12px 0 6px" }}>
            <i
              style={{
                width: `${
                  state.calibrating
                    ? Math.min(100, (state.solves || 0) * 10)
                    : tierInfo.pr * 100
                }%`,
                background: tierInfo.color || "#2F7BFF",
              }}
            />
          </div>
          <p className="mu">
            {state.calibrating
              ? `Rated solves ${state.solves || 0} of 10. Your tier is revealed after that.`
              : tierInfo.nextAt
                ? `${tierInfo.nextAt - (tierInfo.R || state.rating)} to ${tierInfo.nextName}. Tap for details.`
                : "Top tier. Tap for details."}
          </p>
        </section>

        {/* Word of the day card */}
        <section className="card wordc">
          <h2>Word of the day</h2>
          <div className="word">{word[0]}</div>
          <p className="mu">
            <i>{word[1]}</i> {word[2]}
          </p>
          <p>“{word[3]}”</p>
          <button
            className={`btn ${isWordLearned ? "ghost" : ""}`}
            id="wl"
            onClick={handleLearnWord}
          >
            {isWordLearned ? "Learned today ✓" : "I learned it"}
          </button>
          <p className="mu">{state.wordsLearned || 0} word(s) learned so far.</p>
        </section>

        {/* Revision queue card */}
        <section className="card wide">
          <h2>Revision queue</h2>
          {rv.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="rvt">
                <thead>
                  <tr>
                    <th>Problem</th>
                    <th>Topic</th>
                    <th>Difficulty</th>
                    <th>Acceptance</th>
                    <th>Points</th>
                    <th>Due</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rv.map((r, i) => {
                    const q = r.q || {};
                    return (
                      <tr key={i}>
                        <td>
                          <b>{r.title}</b>
                        </td>
                        <td>
                          <span className="tag">{q.topic || "-"}</span>
                        </td>
                        <td>
                          {q.l != null ? (
                            <span className={`dc d${["E", "M", "H"][q.l]}`}>
                              {DIFFICULTY_LABELS[q.l]}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{q.ac ? `${q.ac}%` : "65%"}</td>
                        <td>{q.pts || 25}</td>
                        <td className="mu">{r.due}</td>
                        <td>
                          <button
                            className="btn ghost"
                            onClick={() => {
                              if (r.q) {
                                setCurrentQ(r.q);
                                setState((s) => ({ ...s, att: null }));
                                setView("solve");
                              } else {
                                setView("problems");
                              }
                            }}
                          >
                            Practice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mu">
              Nothing due. Problems you fail or solve below Tier 3 come back here after 3, 7 and 21 days.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
