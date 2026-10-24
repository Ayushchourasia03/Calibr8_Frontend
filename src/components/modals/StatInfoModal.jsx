import { useCalibr8 } from "../../context/Calibr8Context";

export function StatInfoModal() {
  const { state, activeModal, setActiveModal, modalData, setView } =
    useCalibr8();

  if (activeModal !== "stat") return null;

  const close = () => setActiveModal(null);
  const statKey = modalData?.statKey || "score";

  const renderContent = () => {
    if (statKey === "score") {
      const pts = Math.floor((state.score || 0) / 10);
      return (
        <div>
          <h2>Score: {pts.toLocaleString()} points</h2>
          <p className="mu" style={{ margin: "6px 0 14px" }}>
            Score determines your global and college ranking. It is never deducted, so buying themes or items in the store never lowers your rank.
          </p>

          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "14px" }}>
            <div className="card" style={{ textAlign: "center", padding: "10px" }}>
              <div className="big" style={{ fontSize: "24px" }}>{state.solves || 0}</div>
              <div className="mu" style={{ fontSize: "11px" }}>rated solves</div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "10px" }}>
              <div className="big" style={{ fontSize: "24px" }}>
                {Object.keys(state.best || {}).length}
              </div>
              <div className="mu" style={{ fontSize: "11px" }}>questions scored</div>
            </div>
            <div className="card" style={{ textAlign: "center", padding: "10px" }}>
              <div className="big" style={{ fontSize: "24px" }}>
                {Object.keys(state.solved || {}).length}
              </div>
              <div className="mu" style={{ fontSize: "11px" }}>catalog solves</div>
            </div>
          </div>

          <h3>How Points are Earned</h3>
          <p className="mu" style={{ fontSize: "13px", margin: "4px 0 16px" }}>
            Question points × tier passed (30% brute force, 65% better, 100% optimal) × mode (1.0× relaxed, 1.5× strict mode). Improving an earlier result adds only the delta score.
          </p>

          <button
            onClick={() => {
              close();
              setView("board");
            }}
            className="btn"
            style={{ width: "100%" }}
          >
            See Leaderboard Rankings
          </button>
        </div>
      );
    }

    if (statKey === "streak") {
      const st = state.streak || 0;
      return (
        <div>
          <h2>Streak: {st} days</h2>
          <p className="mu" style={{ margin: "6px 0 14px" }}>
            Solve either the daily question or any stretch target before midnight to extend your streak.
          </p>

          <div className="card streakc" style={{ padding: "14px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="flame">🔥</span>
              <div>
                <b style={{ fontSize: "18px" }}>Streak Active</b>
                <div className="mu" style={{ fontSize: "12px" }}>
                  Status updates nightly at midnight.
                </div>
              </div>
            </div>
          </div>

          <h3>Streak Multipliers</h3>
          <p className="mu" style={{ fontSize: "13px", margin: "4px 0 16px" }}>
            Milestones at 7, 14, 30, and 100 days grant free store coins and bonus dry runs.
          </p>

          <button
            onClick={() => {
              close();
              setView("home");
            }}
            className="btn"
            style={{ width: "100%" }}
          >
            Practice Today's Question
          </button>
        </div>
      );
    }

    if (statKey === "coins") {
      return (
        <div>
          <h2>Coins: {state.coins || 0} 🪙</h2>
          <p className="mu" style={{ margin: "6px 0 14px" }}>
            Coins are earned through verified practice, daily completions, and vocabulary words. Spend them on cosmetics and dry run compilations.
          </p>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div className="card" style={{ padding: "12px" }}>
              <b>Store Skins</b>
              <div className="mu" style={{ fontSize: "12px", margin: "4px 0 8px" }}>
                Orbit, Frost, Arcade, Racer and more themes.
              </div>
              <span className="ok">400 - 550 Coins</span>
            </div>
            <div className="card" style={{ padding: "12px" }}>
              <b>Dry Runs</b>
              <div className="mu" style={{ fontSize: "12px", margin: "4px 0 8px" }}>
                Test your code against hidden test cases.
              </div>
              <span className="ok">80 Coins / 5 runs</span>
            </div>
          </div>

          <button
            onClick={() => {
              close();
              setView("store");
            }}
            className="btn"
            style={{ width: "100%" }}
          >
            Visit Themes Store →
          </button>
        </div>
      );
    }

    // Default rating
    return (
      <div>
        <h2>Rating: {state.rating || 1630} ELO</h2>
        <p className="mu" style={{ margin: "6px 0 14px" }}>
          Your true skill calibration computed from diagnostic accuracy and algorithm time/space complexities.
        </p>

        <div className="card" style={{ padding: "14px", marginBottom: "14px" }}>
          <b>Independent Topic Ratings</b>
          <p className="mu" style={{ fontSize: "12px", margin: "4px 0" }}>
            Calibr8 tracks each topic (Arrays, Graphs, Sliding Window, DP, etc.) separately to serve questions right at your learning edge.
          </p>
        </div>

        <button
          onClick={() => {
            close();
            setView("problems");
          }}
          className="btn"
          style={{ width: "100%" }}
        >
          View Problems Catalog
        </button>
      </div>
    );
  };

  return (
    <div className="modal" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close}>
          ×
        </button>
        {renderContent()}
      </div>
    </div>
  );
}
