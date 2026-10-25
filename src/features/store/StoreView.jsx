import { useEffect } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";
import { SKINS } from "../../data/themesData";
import { themesApi } from "./themesApi";
import { tokenStorage } from "../../services/apiClient";

export function StoreView() {
  const {
    state,
    setState,
    previewSkinId,
    setPreviewSkinId,
    buyOrApplySkin,
    showToast,
  } = useCalibr8();

  useEffect(() => {
    let active = true;
    async function loadThemes() {
      if (!tokenStorage.get()) return;
      try {
        const res = await themesApi.getAll();
        if (active && res?.themes && res.coins !== undefined) {
          setState((s) => ({
            ...s,
            coins: res.coins,
            ownedSkins: res.themes.filter((t) => t.owned).map((t) => t.slug),
          }));
        }
      } catch {
        // Use local skin state
      }
    }
    loadThemes();
    return () => {
      active = false;
    };
  }, [setState]);

  const ownedSkins = state.ownedSkins || ["default"];
  const currentSkin = state.skin || "default";

  const handleBuyDryRuns = () => {
    if (state.coins < 80) {
      showToast("Not enough coins! 5 dry runs require 80 coins.");
      return;
    }
    setState((s) => ({
      ...s,
      coins: s.coins - 80,
      freeDry: (s.freeDry || 0) + 5,
    }));
    showToast("Purchased 5 dry runs for 80 coins!");
  };

  // Theme preview styling variables
  const getSkinVariables = (skinId) => {
    switch (skinId) {
      case "orbit":
        return {
          "--pb": "#031a22",
          "--pc": "#062a36",
          "--pf": "#35E6FF",
          "--pa": "#35E6FF",
          "--pr": "4px",
          "--pfont": "system-ui",
        };
      case "frost":
        return {
          "--pb": "#EEF0FA",
          "--pc": "#FFFFFF",
          "--pf": "#14152B",
          "--pa": "#12132A",
          "--pr": "18px",
          "--pfont": "system-ui",
        };
      case "editorial":
        return {
          "--pb": "#F7F4EE",
          "--pc": "#FBF9F4",
          "--pf": "#14120F",
          "--pa": "#14120F",
          "--pr": "14px",
          "--pfont": "Newsreader, Georgia, serif",
        };
      case "mono":
        return {
          "--pb": "#0A0A0A",
          "--pc": "#141414",
          "--pf": "#FFFFFF",
          "--pa": "#FFFFFF",
          "--pr": "0px",
          "--pfont": "Impact, sans-serif",
        };
      case "pearl":
        return {
          "--pb": "#ECECEE",
          "--pc": "#FFFFFF",
          "--pf": "#0E0E10",
          "--pa": "#111111",
          "--pr": "20px",
          "--pfont": "Newsreader, Georgia, serif",
        };
      case "arcade":
        return {
          "--pb": "#0B0620",
          "--pc": "#150C33",
          "--pf": "#00FFC6",
          "--pa": "#FF2E97",
          "--pr": "3px",
          "--pfont": "Orbitron, system-ui",
        };
      case "racer":
        return {
          "--pb": "#0B0B0D",
          "--pc": "#17171B",
          "--pf": "#FF1E1E",
          "--pa": "#FF1E1E",
          "--pr": "2px",
          "--pfont": "Impact, sans-serif",
        };
      default:
        return {
          "--pb": "#000511",
          "--pc": "rgba(8, 16, 34, 0.72)",
          "--pf": "#7CC0FF",
          "--pa": "#2F8BFF",
          "--pr": "14px",
          "--pfont": "system-ui",
        };
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <h1>Calibr8 Themes & Store</h1>
        <p className="mu" style={{ margin: "4px 0" }}>
          Themes transform the design archetype: typography, borders, glow, and layout. Preview any skin for free, then purchase with earned coins.
        </p>
      </div>

      {/* Floating Preview Bar */}
      {previewSkinId && (
        <div id="pvbar">
          <span>
            Previewing: <b>{SKINS[previewSkinId]?.name}</b>
          </span>
          <button
            className="btn"
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={() => buyOrApplySkin(previewSkinId)}
          >
            {ownedSkins.includes(previewSkinId)
              ? "Apply Theme"
              : `Buy for ${SKINS[previewSkinId]?.price} coins`}
          </button>
          <button
            className="btn ghost"
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={() => setPreviewSkinId(null)}
          >
            Exit Preview
          </button>
        </div>
      )}

      {/* Power-ups banner */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div>
          <h3>Dry Run Compilations</h3>
          <p className="mu" style={{ margin: 0, fontSize: "13px" }}>
            You have <b>{state.freeDry || 0}</b> free dry runs remaining • Balance: <b>{state.coins || 0}</b> coins
          </p>
        </div>
        <button
          className="btn"
          style={{ fontSize: "12px" }}
          onClick={handleBuyDryRuns}
        >
          Buy 5 Dry Runs (80 Coins)
        </button>
      </div>

      {/* Themes Grid */}
      <div className="grid">
        {Object.values(SKINS).map((skin) => {
          const isOwned = ownedSkins.includes(skin.id);
          const isApplied = currentSkin === skin.id && !previewSkinId;
          const isPreviewing = previewSkinId === skin.id;
          const skinVars = getSkinVariables(skin.id);

          return (
            <div key={skin.id} className="card">
              {/* Mini theme preview box */}
              <div className="pv" style={skinVars}>
                <b>Aa {skin.name}</b>
                <i />
                <u>Button</u>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "6px 0" }}>
                <h3 style={{ margin: 0 }}>{skin.name}</h3>
                <span className="mu" style={{ fontSize: "12px" }}>
                  {skin.price === 0 ? "Free Default" : `${skin.price} Coins`}
                </span>
              </div>

              <p className="mu" style={{ fontSize: "12px", minHeight: "36px", margin: "4px 0 10px" }}>
                {skin.description}
              </p>

              <div className="row" style={{ marginTop: "auto", gap: "6px" }}>
                <button
                  className="btn ghost"
                  style={{ flex: 1, fontSize: "12px", padding: "6px" }}
                  onClick={() => setPreviewSkinId(skin.id)}
                >
                  {isPreviewing ? "Previewing" : "Preview"}
                </button>

                <button
                  className={`btn ${isApplied ? "ghost" : ""}`}
                  style={{ flex: 1, fontSize: "12px", padding: "6px" }}
                  disabled={isApplied}
                  onClick={() => buyOrApplySkin(skin.id)}
                >
                  {isApplied
                    ? "Active ✓"
                    : isOwned
                      ? "Apply"
                      : `Unlock (${skin.price})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}