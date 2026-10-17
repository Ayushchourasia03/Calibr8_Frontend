import { useState, useEffect } from "react";
import { TIERS, BANK, DEFAULT_QUESTION, DIFFICULTY_LABELS } from "../constants";
import { api, tokenStorage } from "../services/api";

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
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [apiTopics, setApiTopics] = useState([]);
  const [dsaTopics, setDsaTopics] = useState([]);
  const [coreTopics, setCoreTopics] = useState([]);

  // Check existing token and fetch authenticated user on load
  useEffect(() => {
    let isMounted = true;

    async function initUser() {
      const token = tokenStorage.get();
      if (!token) {
        if (isMounted) setIsAuthLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (isMounted && res.success && res.user) {
          setUser(res.user);
          // Sync rating and levels if user was already calibrated
          if (res.user.rating) {
            setState((s) => ({
              ...s,
              rating: res.user.rating,
              started: res.user.onboarded || s.started
            }));
          }
        }
      } catch (err) {
        console.warn("Session check failed or expired:", err.message);
        tokenStorage.remove();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    }

    async function loadTopics() {
      try {
        const res = await api.topics.getAll();
        if (isMounted && res.success) {
          setApiTopics(res.topics || []);
          setDsaTopics(res.dsaTopics || []);
          setCoreTopics(res.coreTopics || []);
        }
      } catch (err) {
        console.warn("Could not fetch remote topics, using local fallback:", err.message);
      }
    }

    initUser();
    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save local state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  }, [state]);

  const login = async ({ email, password }) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.rating) {
        setState((s) => ({
          ...s,
          rating: res.user.rating,
          started: res.user.onboarded || s.started
        }));
      }
    }
    return res;
  };

  const register = async ({ name, email, password }) => {
    const res = await api.auth.register({ name, email, password });
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.rating) {
        setState((s) => ({
          ...s,
          rating: res.user.rating,
          started: res.user.onboarded || s.started
        }));
      }
    }
    return res;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const updateProfileName = async (name) => {
    const res = await api.profile.updateMe({ name });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const changePassword = async (oldPassword, newPassword) => {
    return await api.auth.changePassword({ oldPassword, newPassword });
  };

  const saveOnboarding = async (payload) => {
    // If authenticated, persist to backend API
    if (user && tokenStorage.get()) {
      try {
        const res = await api.onboarding.submit(payload);
        if (res.success && res.user) {
          setUser(res.user);
          return res.user;
        }
      } catch (err) {
        console.warn("Onboarding API sync failed:", err.message);
        throw err;
      }
    }
    return null;
  };

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
    isAuthModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    user,
    setUser,
    isAuthLoading,
    apiTopics,
    dsaTopics,
    coreTopics,
    login,
    register,
    logout,
    updateProfileName,
    changePassword,
    saveOnboarding,
    getTier,
    getTopicRating,
    getOverallRating,
    createQuestion,
    setView,
    setTopicLevel
  };
}