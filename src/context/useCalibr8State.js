import { useState, useEffect } from "react";
import { TIERS, BANK, DEFAULT_QUESTION, DIFFICULTY_LABELS } from "../constants";

const STORAGE_KEY = "calibr8-react-v1";

export function useCalibr8State() {
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
      owned: ["default"],
      board: "College",
      att: null,
      levels: { "Sliding Window": 1, Graphs: 2, Arrays: 1 },
      ratings: { "Sliding Window": 1250, Graphs: 1700, Arrays: 1250 },
      topics: {
        Arrays: 2, Strings: 1, Recursion: 0, Graphs: 3,
        "Sliding Window": 1, DP: 0, SQL: 1, Aptitude: 2
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
      started: false
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
    } catch (e) {
      console.error(e);
    }
    return initial;
  });

  const [currentQ, setCurrentQ] = useState(DEFAULT_QUESTION);
  const [isLevelModalOpen, setLevelModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  }, [state]);

  const getTier = (r = state.rating) =>
    TIERS[Math.min(5, Math.max(0, Math.floor((r - 700) / 200)))];

  const getTopicRating = (topic) =>
    state.ratings?.[topic] ?? [800, 1200, 1600][state.levels?.[topic] || 0];

  const getOverallRating = () => {
    const keys = Object.keys(state.levels || {});
    if (!keys.length) return state.rating;
    const sum = keys.reduce((acc, t) => acc + getTopicRating(t), 0);
    return Math.round(sum / keys.length);
  };

  const createQuestion = (isStretch = false) => {
    const L = state.levels || { Arrays: 1 };
    const ts = Object.keys(L).sort((a, b) => getTopicRating(a) - getTopicRating(b));
    const topic = ts[(isStretch ? (state.stretchN || 0) + 1 : 0) % ts.length];
    const lvl = L[topic] ?? 1;
    const b = BANK[topic] || ["Challenge", "Solve the challenge"];
    const isSw = topic === "Sliding Window";

    return {
      topic,
      l: lvl,
      d: Math.round(getTopicRating(topic) - 147 + (isStretch ? 120 : 0)),
      title: `${b[0]} (${DIFFICULTY_LABELS[lvl]})`,
      text: b[1],
      ex: isSw ? "readings = [4, 8, 5, 1, 7], k = 4  ->  3" : "See the statement details.",
      pts: [10, 25, 50][lvl],
      key: `${topic}_${lvl}_${isStretch ? "s" + state.stretchN : "d"}_${state.dayStamp}`,
      hints: isSw ? DEFAULT_QUESTION.hints : [
        "Think about what you must track as you scan the input.",
        "Name the pattern that keeps that information cheaply.",
        "Outline: set up, loop once, update the answer, return it."
      ],
      trace: isSw ? DEFAULT_QUESTION.trace : [["Ready", "[]", "0", "0", "0"]],
      stretch: Boolean(isStretch)
    };
  };

  const setView = (view) => {
    if (state.att?.mode === "strict" && state.att?.active) {
      alert("Finish or abandon the strict attempt first.");
      return;
    }
    setState((s) => ({ ...s, view }));
  };

  const setTopicLevel = (topic, level) => {
    setState((s) => {
      const nextLevels = { ...s.levels, [topic]: level };
      const nextRatings = { ...s.ratings, [topic]: [800, 1200, 1600][level] };
      return {
        ...s,
        levels: nextLevels,
        ratings: nextRatings,
        rating: Math.round(Object.values(nextRatings).reduce((a, b) => a + b, 0) / Object.values(nextRatings).length)
      };
    });
  };

  return {
    state,
    setState,
    currentQ,
    setCurrentQ,
    isLevelModalOpen,
    setLevelModalOpen,
    getTier,
    getTopicRating,
    getOverallRating,
    createQuestion,
    setView,
    setTopicLevel
  };
}