/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getTierInfo } from "../utils/tierUtils";
import { api, tokenStorage } from "../services/api";
import { SKINS } from "../data/themesData";

const STORAGE_KEY = "calibr8-v1";

const VIEW_PATHS = {
  landing: "/welcome",
  home: "/",
  solve: "/solve",
  problems: "/problems",
  library: "/library",
  tracks: "/tracks",
  board: "/rankings",
  me: "/profile",
  store: "/store",
};
const PATH_VIEWS = Object.fromEntries(
  Object.entries(VIEW_PATHS).map(([v, p]) => [p, v]),
);

function viewFromPath(pathname) {
  return PATH_VIEWS[pathname.replace(/\/+$/, "") || "/"] || "home";
}

export const Calibr8Context = createContext(null);

export function useCalibr8() {
  const context = useContext(Calibr8Context);
  if (!context) {
    throw new Error("useCalibr8 must be used within Calibr8Provider");
  }
  return context;
}

export function Calibr8Provider({ children }) {
  const [state, setState] = useState(() => {
    const today = Math.floor(Date.now() / 864e5);
    const hasToken = Boolean(tokenStorage.get());
    const initial = {
      view: hasToken ? viewFromPath(window.location.pathname) : "landing",
      coins: 0,
      score: 0,
      rating: 0,
      streak: 0,
      headerStats: null,
      calibrating: false,
      theme: "default",
      skin: "default",
      ownedSkins: ["default"],
      att: null,
      levels: {},
      ratings: {},
      topics: {},
      solves: 0,
      daily: null,
      dailyDone: false,
      stretch: null,
      stretchN: 0,
      best: {},
      revise: [],
      dayStamp: today,
      started: false,
      mode: "light",
      modePreferenceSet: false,
      lang: "Python3",
      user: null,
      activity: {},
      dd: {},
      name: "",
      avatar: "🙂",
      wordDay: "",
      wordsLearned: 0,
      solved: {},
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dayStamp !== today) {
          parsed.dailyDone = false;
          parsed.daily = null;
          parsed.stretch = null;
        }
        return {
          ...initial,
          ...parsed,
          view:
            hasToken || parsed.user?.guest
              ? viewFromPath(window.location.pathname)
              : "landing",
          user: hasToken || parsed.user?.guest ? parsed.user : null,
          headerStats: hasToken ? null : (parsed.headerStats ?? null),
        };
      }
    } catch {
      // Ignore invalid or unavailable local storage and use the defaults.
    }
    return initial;
  });

  const [currentQ, setCurrentQ] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [previewSkinId, setPreviewSkinId] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const showToast = useCallback((m) => {
    setToastMessage(m);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  }, [state]);

  // Sync user from backend - single source of truth for coins/score/streak
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const health = await api.system.health();
        if (mounted && health.status === "ok") setBackendConnected(true);
      } catch {
        setBackendConnected(false);
      }

      const token = tokenStorage.get();
      if (!token) return;
      try {
        const res = await api.auth.getMe();
        if (mounted && res?.success && res.user) {
          setState((s) => ({
            ...s,
            user: res.user,
            headerStats: res.stats || null,
            name: res.user.name || s.name,
            rating: res.stats?.rating ?? res.user.rating ?? s.rating,
            score: res.stats?.scoreUnits ?? res.user.score ?? s.score,
            streak: res.stats?.streak ?? res.user.streak ?? s.streak,
            coins: res.stats?.coins ?? res.user.coins ?? s.coins,
            started: res.user.onboarded || s.started,
          }));
        }
      } catch {
        tokenStorage.remove();
        if (mounted) setState((s) => ({ ...s, user: null, view: "landing" }));
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const setView = (view) => {
    if (state.att?.mode === "strict" && state.att?.active) {
      showToast("Finish or abandon the strict attempt first.");
      return;
    }
    setState((s) => ({ ...s, view }));
  };

  const createQuestion = (isStretch = false) => {
    const question = isStretch ? state.stretch : state.daily;
    return question || {
      key: isStretch ? "stretch-question" : "daily-question",
      title: isStretch ? "Choose a stretch problem" : "Your daily question",
      difficulty: isStretch ? "Medium" : "Easy",
      topic: "Practice",
      description: "Choose a problem from the catalogue to start practicing.",
      hints: [],
      examples: [],
    };
  };

  const openProblemInSolver = (problem) => {
    if (!problem) return;
    setCurrentQ(problem);
    setState((current) => ({ ...current, att: null, view: "solve" }));
  };

  const login = async (credentials) => {
    const result = await api.auth.login(credentials);
    const user = result?.user;
    if (user) {
      setState((current) => ({
        ...current,
        user,
        name: user.name || current.name,
        view: "home",
      }));
    }
    return result;
  };

  const logout = async () => {
    await api.auth.logout();
    setState((current) => ({ ...current, user: null, headerStats: null, view: "landing" }));
    setCurrentQ(null);
  };

  const exploreDemo = () => {
    setState((current) => ({
      ...current,
      user: { guest: true, email: "guest@calibr8.local", name: "Guest Learner" },
      name: "Guest Learner",
      view: "home",
    }));
  };

  const buyOrApplySkin = async (skinId) => {
    const skin = SKINS[skinId];
    if (!skin) return false;
    try {
      if (state.ownedSkins?.includes(skinId)) {
        if (tokenStorage.get()) await api.themes.applyTheme(skinId);
      } else {
        if (tokenStorage.get()) {
          const result = await api.themes.buyTheme(skinId);
          setState((current) => ({
            ...current,
            coins: result.coins ?? current.coins,
            ownedSkins: [...new Set([...(current.ownedSkins || []), skinId])],
          }));
        } else if ((state.coins || 0) < skin.price) {
          showToast("You need more coins to buy this theme.");
          return false;
        } else {
          setState((current) => ({
            ...current,
            coins: current.coins - skin.price,
            ownedSkins: [...new Set([...(current.ownedSkins || []), skinId])],
          }));
        }
      }
      setState((current) => ({ ...current, skin: skinId, theme: skinId }));
      return true;
    } catch (error) {
      showToast(error.message || "Could not apply this theme.");
      return false;
    }
  };

  const toggleThemeMode = () => {
    setState((s) => ({
      ...s,
      mode: s.mode === "light" ? "dark" : "light",
      modePreferenceSet: true,
    }));
  };

  const getTopicRating = (topic) => {
    const rating = Number(state.ratings?.[topic]);
    if (Number.isFinite(rating) && rating > 0) return rating;

    const level = Number(state.levels?.[topic] ?? 0);
    return [800, 1200, 1600][level] ?? 800;
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
        setView,
        createQuestion,
        openProblemInSolver,
        login,
        logout,
        exploreDemo,
        buyOrApplySkin,
        user: state.user,
        refreshUser: async () => {
          const result = await api.auth.getMe();
          if (result?.user) setState((current) => ({ ...current, user: result.user }));
          return result;
        },
        toggleThemeMode,
        getTopicRating,
        tierInfo: getTierInfo(state.rating),
        backendConnected,
        isAuthModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        api,
      }}
    >
      {children}
    </Calibr8Context.Provider>
  );
}
