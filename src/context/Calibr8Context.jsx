import { createContext, useState, useEffect } from "react";
import {
  DEFAULT_QUESTION,
  BANK,
  DIFFICULTY_LABELS,
} from "../data/constants";
import { SKINS } from "../data/themesData";
import { getTierInfo } from "../utils/tierUtils";
import { analyzeCode, formatTimeComplexity, formatSpaceComplexity } from "../utils/codeAnalyzer";

const STORAGE_KEY = "calibr8-v1";

export const Calibr8Context = createContext(null);

export function Calibr8Provider({ children }) {
  const [state, setState] = useState(() => {
    const today = Math.floor(Date.now() / 864e5);
    const initial = {
      view: "landing",
      coins: 340,
      score: 1630,
      rating: 1630,
      streak: 46,
      calibrating: false,
      freeDry: 3,
      theme: "default",
      skin: "default",
      ownedSkins: ["default"],
      owned: ["default"],
      board: "College",
      att: null,
      levels: { "Sliding Window": 1, Graphs: 2, Arrays: 1 },
      ratings: { "Sliding Window": 1250, Graphs: 1700, Arrays: 1250 },
      topics: {
        Arrays: 2,
        Strings: 1,
        Recursion: 0,
        Graphs: 3,
        "Sliding Window": 1,
        DP: 0,
        SQL: 1,
        Aptitude: 2,
      },
      videos: { "Sliding Window": false, Graphs: true },
      solves: 6,
      daily: null,
      dailyDone: false,
      stretch: null,
      stretchN: 0,
      best: {},
      revise: [],
      dayStamp: today,
      started: false,
      mode: "dark",
      lang: "Python3",
      user: null,
      notes: {},
      activity: {},
      dd: {},
      recent: [],
      hist: [],
      name: "",
      college: "",
      avatar: "🙂",
      wordDay: "",
      wordsLearned: 0,
      lib: {},
      libCat: 0,
      act: "y",
      solved: {},
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dayStamp !== today) {
          parsed.dayStamp = today;
          parsed.dailyDone = false;
          parsed.daily = null;
          parsed.stretch = null;
          parsed.stretchN = 0;
        }
        return { ...initial, ...parsed };
      }
    } catch {
      // ignore
    }
    return initial;
  });

  const [currentQ, setCurrentQ] = useState(DEFAULT_QUESTION);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'onboarding' | 'level' | 'tier' | 'stat' | 'track' | 'video'
  const [modalData, setModalData] = useState(null);

  // Skin preview state
  const [previewSkinId, setPreviewSkinId] = useState(null);

  // Sync skin and theme attributes to HTML root
  useEffect(() => {
    const currentSkin = previewSkinId || state.skin || "default";
    document.documentElement.dataset.skin = currentSkin;
    document.documentElement.dataset.theme = state.mode || "dark";
  }, [state.skin, state.mode, previewSkinId]);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const getTopicRating = (topic) => {
    return state.ratings?.[topic] ?? [800, 1200, 1600][state.levels?.[topic] || 0];
  };

  const getOverallRating = () => {
    const keys = Object.keys(state.levels || {});
    if (!keys.length) return state.rating || 1200;
    const sum = keys.reduce((acc, t) => acc + getTopicRating(t), 0);
    return Math.round(sum / keys.length);
  };

  const createQuestion = (isStretch = false) => {
    const L = state.levels || { Arrays: 1 };
    const ts = Object.keys(L).sort(
      (a, b) => getTopicRating(a) - getTopicRating(b),
    );
    const topic = ts[(isStretch ? (state.stretchN || 0) + 1 : 0) % ts.length] || "Arrays";
    const lvl = L[topic] ?? 1;
    const b = BANK[topic] || ["Challenge", "Solve the challenge problem."];
    const isSw = topic === "Sliding Window";

    return {
      topic,
      l: lvl,
      d: Math.round(getTopicRating(topic) - 147 + (isStretch ? 120 : 0)),
      title: `${b[0]} (${DIFFICULTY_LABELS[lvl]})`,
      text: b[1],
      ex: isSw
        ? "readings = [4, 8, 5, 1, 7], k = 4  ->  3"
        : "See the statement details.",
      pts: [10, 25, 50][lvl],
      key: `${topic}_${lvl}_${isStretch ? "s" + state.stretchN : "d"}_${state.dayStamp}`,
      hints: isSw
        ? DEFAULT_QUESTION.hints
        : [
            "Think about what you must track as you scan the input.",
            "Name the pattern that keeps that information cheaply.",
            "Outline: set up, loop once, update the answer, return it.",
          ],
      trace: isSw
        ? DEFAULT_QUESTION.trace
        : [["Ready", "[]", "0", "0", "0"]],
      stretch: Boolean(isStretch),
    };
  };

  const setView = (view) => {
    if (state.att?.mode === "strict" && state.att?.active) {
      showToast("Finish or abandon the strict attempt first.");
      return;
    }
    if (previewSkinId && view !== "store") {
      setPreviewSkinId(null);
    }
    setState((s) => ({ ...s, view }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setTopicLevel = (topic, level) => {
    setState((s) => {
      const nextLevels = { ...s.levels, [topic]: level };
      const nextRatings = {
        ...s.ratings,
        [topic]: [800, 1200, 1600][level],
      };
      const keys = Object.keys(nextRatings);
      const nextOverall = Math.round(
        keys.reduce((acc, k) => acc + nextRatings[k], 0) / keys.length,
      );
      return {
        ...s,
        levels: nextLevels,
        ratings: nextRatings,
        rating: nextOverall,
      };
    });
  };

  const toggleThemeMode = () => {
    setState((s) => ({
      ...s,
      mode: s.mode === "light" ? "dark" : "light",
    }));
  };

  const buyOrApplySkin = (skinId) => {
    const skin = SKINS[skinId];
    if (!skin) return;
    const owned = state.ownedSkins || ["default"];
    if (!owned.includes(skinId)) {
      if (state.coins < skin.price) {
        showToast(`Not enough coins! This theme requires ${skin.price} coins.`);
        return false;
      }
      setState((s) => ({
        ...s,
        coins: s.coins - skin.price,
        ownedSkins: [...owned, skinId],
        skin: skinId,
      }));
      setPreviewSkinId(null);
      showToast(`Purchased & applied ${skin.name} theme!`);
      return true;
    } else {
      setState((s) => ({
        ...s,
        skin: skinId,
      }));
      setPreviewSkinId(null);
      showToast(`Applied ${skin.name} theme.`);
      return true;
    }
  };

  const openProblemInSolver = (problem) => {
    setCurrentQ({
      topic: problem.t,
      l: problem.l,
      d: problem.d,
      title: `${problem.title} (${DIFFICULTY_LABELS[problem.l]})`,
      text: `A ${DIFFICULTY_LABELS[problem.l].toLowerCase()} ${problem.t} problem from the Calibr8 catalog. Solve it with optimal time and space complexity.`,
      ex: "Read constraints and implement the requested algorithm.",
      pts: problem.pts,
      key: `c${problem.id}`,
      hints: [
        "Think about what you must track as you scan the input.",
        "Name the pattern that keeps that information cheaply.",
        "Outline: set up, loop once, update the answer, return it.",
      ],
      trace: [["Step 1", "[init]", "0", "0", "0"]],
      stretch: false,
    });
    setState((s) => ({ ...s, att: null }));
    setView("solve");
  };

  return (
    <Calibr8Context.Provider
      value={{
        state,
        setState,
        currentQ,
        setCurrentQ,
        activeModal,
        setActiveModal,
        modalData,
        setModalData,
        previewSkinId,
        setPreviewSkinId,
        toastMessage,
        showToast,
        getTopicRating,
        getOverallRating,
        createQuestion,
        setView,
        setTopicLevel,
        toggleThemeMode,
        buyOrApplySkin,
        openProblemInSolver,
        tierInfo: getTierInfo(state.rating),
        analyzeCode,
        formatTimeComplexity,
        formatSpaceComplexity,
      }}
    >
      {children}
    </Calibr8Context.Provider>
  );
}

export { useCalibr8 } from "./useCalibr8";
