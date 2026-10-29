import { useState, useEffect, useRef } from "react";
import { useCalibr8 } from "../../context/Calibr8Context";

const MUS = {
  orbit: { w: "sine", bpm: 72, b: 110, s: [0, 7, 12, 7, 5, 7, 3, 0] },
  frost: { w: "triangle", bpm: 80, b: 262, s: [0, 4, 9, 7, 5, 9, 12, 7] },
  editorial: { w: "sine", bpm: 76, b: 196, s: [0, 4, 7, 4, 2, 4, 0, -3] },
  mono: { w: "sine", bpm: 60, b: 82, s: [0, 0, 7, 5] },
  pearl: { w: "sine", bpm: 70, b: 262, s: [0, 7, 4, 9, 5, 12, 7, 4] },
  arcade: { w: "square", bpm: 140, b: 196, s: [0, 4, 7, 12, 7, 4, 9, 5] },
  racer: { w: "sawtooth", bpm: 150, b: 98, s: [0, 0, 7, 0, 10, 0, 7, 5] },
  anime: { w: "triangle", bpm: 118, b: 262, s: [0, 2, 4, 7, 9, 7, 4, 2] },
  comic: { w: "square", bpm: 128, b: 165, s: [0, 0, 5, 7, 0, 0, 10, 7] },
  storybook: { w: "sine", bpm: 84, b: 330, s: [0, 4, 7, 12, 16, 12, 7, 4] },
};

export function ThemeOverlay() {
  const { state, previewSkinId, tierInfo } = useCalibr8();
  const activeSkin = previewSkinId || state.skin || "default";

  const [playingSkin, setPlayingSkin] = useState(null);
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  const isMusicPlaying = playingSkin === activeSkin && Boolean(MUS[activeSkin]);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq, startTime, duration, type, volume) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {
      // Audio context might fail in strict environments
    }
  };

  const stopMusic = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlayingSkin(null);
  };

  const startMusic = (skinId) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const config = MUS[skinId];
    if (!config) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    let noteIdx = 0;
    const stepSeconds = 60 / config.bpm / 2;

    intervalRef.current = setInterval(() => {
      const noteOffset = config.s[noteIdx % config.s.length];
      const freq = config.b * Math.pow(2, noteOffset / 12);
      const nowTime = ctx.currentTime;
      playTone(freq, nowTime, stepSeconds * 1.7, config.w, 0.045);
      if (noteIdx % 4 === 0) {
        playTone(freq / 2, nowTime, stepSeconds * 3.5, "sine", 0.04);
      }
      noteIdx++;
    }, stepSeconds * 1000);

    setPlayingSkin(skinId);
  };

  const handleHorn = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [349, 440].forEach((f) => {
      playTone(f, t, 0.5, "sawtooth", 0.06);
      playTone(f, t + 0.65, 0.3, "sawtooth", 0.06);
    });

    setTimeout(() => {
      if (!audioCtxRef.current) return;
      const tRev = audioCtxRef.current.currentTime;
      try {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(55, tRev);
        osc.frequency.exponentialRampToValueAtTime(280, tRev + 1.1);
        osc.frequency.exponentialRampToValueAtTime(70, tRev + 1.8);
        gain.gain.setValueAtTime(0.0001, tRev);
        gain.gain.linearRampToValueAtTime(0.07, tRev + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, tRev + 1.9);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start(tRev);
        osc.stop(tRev + 2);
      } catch {
        // ignore
      }
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const hasMusic = Boolean(MUS[activeSkin]);
  const isRacer = activeSkin === "racer";

  const renderDeco = () => {
    switch (activeSkin) {
      case "racer":
        return (
          <div className="d-racer">
            <div className="road">
              <i className="car c1">🏎️</i>
              <i className="car c2">🚗</i>
              <i className="car c3">🚙</i>
            </div>
          </div>
        );
      case "arcade":
        return (
          <div className="d-arcade">
            <span className="star s1">✦</span>
            <span className="star s2">✧</span>
            <span className="star s3">✦</span>
            <div className="hud">
              LEVEL {tierInfo ? tierInfo.i + 1 : 1} <b />
            </div>
          </div>
        );
      case "anime":
        return (
          <div className="d-anime">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                className="pet"
                style={{
                  left: `${i * 8 + (i % 3) * 2}%`,
                  animationDelay: `${i * -1.1}s`,
                  animationDuration: `${9 + (i % 4) * 2}s`,
                }}
              >
                🌸
              </span>
            ))}
          </div>
        );
      case "comic":
        return (
          <div className="d-comic">
            <div className="pow">POW!</div>
          </div>
        );
      case "storybook":
        return (
          <div className="d-storybook">
            <span className="star s1">✨</span>
            <span className="star s2">✨</span>
            <span className="star s3">⭐</span>
            <div className="castle">🏰</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div id="deco" className={`d-${activeSkin}`} aria-hidden="true">
        {renderDeco()}
      </div>

      {hasMusic && (
        <div id="snd" aria-label="Theme audio controls">
          <button
            onClick={() => {
              if (isMusicPlaying) {
                stopMusic();
              } else {
                startMusic(activeSkin);
              }
            }}
            aria-label={isMusicPlaying ? "Pause music" : "Play music"}
          >
            {isMusicPlaying ? "⏸ Music on" : "▶ Music off"}
          </button>
          {isRacer && (
            <button
              onClick={handleHorn}
              aria-label="Horn and engine"
              title="Horn and engine"
            >
              📯
            </button>
          )}
        </div>
      )}
    </>
  );
}
