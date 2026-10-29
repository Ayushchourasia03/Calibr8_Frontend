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
      showToast("Not enough coins. 5 dry runs cost 80 coins.");
      return;
    }
    setState((s) => ({
      ...s,
      coins: s.coins - 80,
      freeDry: (s.freeDry || 0) + 5,
    }));
    showToast("Purchased 5 dry runs for 80 coins!");
  };

  const handlePreview = (skinId) => {
    setPreviewSkinId(skinId);
  };

  const handleExitPreview = () => {
    setPreviewSkinId(null);
  };

  const handleBuyOrApply = async (skinId) => {
    const success = await buyOrApplySkin(skinId);
    if (success && previewSkinId === skinId) {
      setPreviewSkinId(null);
    }
  };

  const previewingSkin = previewSkinId ? SKINS[previewSkinId] : null;

  return (
    <div>
      <h1>Store</h1>
      <p className="mu">
        A theme changes the whole design of the app: type, shapes and effects, not just colours. Preview any theme for free, then buy it with coins. Money never buys score or rank. Themes are original designs inspired by styles such as gaming, anime, comics and fairy tales. They use no franchise characters or logos.
      </p>

      {/* Floating Preview Bar */}
      {previewSkinId && previewingSkin && (
        <div id="pvbar">
          <span>
            Previewing <b>{previewingSkin.name}</b>
          </span>
          <button
            className="btn"
            id="pvy"
            onClick={() => handleBuyOrApply(previewSkinId)}
          >
            {ownedSkins.includes(previewSkinId)
              ? "Apply"
              : `Buy for ${previewingSkin.price} coins`}
          </button>
          <button className="btn ghost" id="pvn" onClick={handleExitPreview}>
            Exit preview
          </button>
        </div>
      )}

      <div className="grid">
        {Object.keys(SKINS).map((id) => {
          const skin = SKINS[id];
          const isOwned = ownedSkins.includes(id);
          const isApplied = currentSkin === id && !previewSkinId;

          return (
            <div key={id} className="card">
              <div className="pv" style={skin.previewVars || {}}>
                <b>{skin.name}</b>
                <i />
                <u>Button</u>
              </div>

              <h3>
                {skin.name}{" "}
                {isApplied ? (
                  <span className="tag ok">applied</span>
                ) : isOwned ? (
                  <span className="tag">owned</span>
                ) : null}
              </h3>

              <p className="mu">{skin.description}</p>

              <ul className="mu" style={{ paddingLeft: "18px", margin: "6px 0" }}>
                {skin.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>

              <div className="row">
                <button
                  className="btn ghost pvb"
                  data-s={id}
                  onClick={() => handlePreview(id)}
                >
                  Preview
                </button>

                {isOwned ? (
                  <button
                    className="btn ap"
                    data-s={id}
                    disabled={isApplied}
                    onClick={() => handleBuyOrApply(id)}
                  >
                    {isApplied ? "Applied" : "Apply"}
                  </button>
                ) : (
                  <button
                    className="btn by"
                    data-s={id}
                    onClick={() => handleBuyOrApply(id)}
                  >
                    Buy for {skin.price} coins
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="card">
          <h3>Dry run pack</h3>
          <p className="mu">5 dry runs for 80 coins.</p>
          <button className="btn" id="dp" onClick={handleBuyDryRuns}>
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}