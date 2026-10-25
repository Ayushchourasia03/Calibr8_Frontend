import { createContext, useState, useEffect, useCallback } from "react";
import {
  DEFAULT_QUESTION,
  BANK,
  DIFFICULTY_LABELS,
} from "../data/constants";
import { SKINS } from "../data/themesData";
import { getTierInfo } from "../utils/tierUtils";
import {
  analyzeCode,
  formatTimeComplexity,
  formatSpaceComplexity,
} from "../utils/codeAnalyzer";
import { api, tokenStorage } from "../services/api";

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
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Auth modal state for quick sign-in triggers
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Skin preview state
  const [previewSkinId, setPreviewSkinId] = useState(null);

  // Backend connectivity status
  const [backendConnected, setBackendConnected] = useState(false);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

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

  // Check backend health & sync authenticated user on app load
  useEffect(() => {
    let isMounted = true;

    async function checkBackendAndUser() {
      try {
        const healthRes = await api.system.health();
        if (isMounted && (healthRes.status === "ok" || healthRes.success)) {
          setBackendConnected(true);
        }
      } catch (err) {
        if (isMounted) {
          setBackendConnected(false);
          console.warn("[Calibr8] Backend at localhost:3000 not reachable:", err.message);
        }
      }

      // Check existing auth token
      const token = tokenStorage.get();
      if (!token) return;

      try {
        const authRes = await api.auth.getMe();
        if (isMounted && authRes?.success && authRes.user) {
          const u = authRes.user;
          setState((s) => ({
            ...s,
            user: u,
            name: u.name || s.name,
            college: u.college || s.college,
            rating: u.rating ?? s.rating,
            score: u.score ?? s.score,
            streak: u.streak ?? s.streak,
            coins: u.coins ?? s.coins,
            started: u.onboarded || s.started,
          }));

          // Sync solved problems list from backend
          try {
            const solvedRes = await api.users.getSolvedProblems();
            if (isMounted && solvedRes?.data) {
              const solvedMap = {};
              solvedRes.data.forEach((p) => {
                if (p.isSolved) {
                  solvedMap[p.slug || p.number] = true;
                }
              });
              setState((s) => ({
                ...s,
                solved: { ...s.solved, ...solvedMap },
              }));
            }
          } catch {
            // ignore
          }

          // Sync user theme status from backend
          try {
            const themeRes = await api.themes.getMe();
            if (isMounted && themeRes?.success) {
              setState((s) => ({
                ...s,
                coins: themeRes.coins ?? s.coins,
                skin: themeRes.activeTheme || s.skin,
                ownedSkins: themeRes.ownedThemes || s.ownedSkins,
              }));
            }
          } catch {
            // ignore
          }
        }
      } catch (authErr) {
        console.warn("Session expired or invalid:", authErr.message);
        tokenStorage.remove();
      }
    }

    checkBackendAndUser();

    return () => {
      isMounted = false;
    };
  }, []);

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
      (a, b) => getTopicRating(a) - getTopicRating(b)
    );
    const topic = ts[(isStretch ? (state.stretchN || 0) + 1 : 0) % ts.length] || "Arrays";
    const lvl = L[topic] ?? 1;
    const b = BANK[topic] || ["Challenge", "Solve the challenge problem."];
    const isSw = topic === "Sliding Window";

    return {
      topic,
      l: lvl,
      difficulty: lvl,
      d: Math.round(getTopicRating(topic) - 147 + (isStretch ? 120 : 0)),
      title: `${b[0]} (${DIFFICULTY_LABELS[lvl]})`,
      text: b[1],
      ex: isSw
        ? "readings = [4, 8, 5, 1, 7], k = 4  ->  3"
        : "See the statement details.",
      pts: [10, 25, 50][lvl],
      key: `${topic}_${lvl}_${isStretch ? "s" + state.stretchN : "d"}_${state.dayStamp}`,
      slug: `daily-${topic.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
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

  // Sync topic calibration to local state + backend API (/api/onboarding)
  const setTopicLevel = async (topic, level) => {
    setState((s) => {
      const nextLevels = { ...s.levels };
      const nextRatings = { ...s.ratings };

      if (level === null || level === undefined) {
        delete nextLevels[topic];
        delete nextRatings[topic];
      } else {
        nextLevels[topic] = level;
        nextRatings[topic] = [800, 1200, 1600][level];
      }

      const keys = Object.keys(nextRatings);
      const nextOverall = keys.length
        ? Math.round(keys.reduce((acc, k) => acc + nextRatings[k], 0) / keys.length)
        : s.rating || 1200;

      return {
        ...s,
        levels: nextLevels,
        ratings: nextRatings,
        rating: nextOverall,
      };
    });

    // If authenticated, sync topic levels with backend API
    if (tokenStorage.get()) {
      try {
        const topicSelections = Object.entries({
          ...state.levels,
          ...(level !== null && level !== undefined ? { [topic]: level } : {}),
        }).map(([tName, lvl]) => ({
          topicId: tName.toLowerCase().replace(/\s+/g, "-"),
          difficulty: ["easy", "medium", "hard"][lvl] || "medium",
        }));

        await api.onboarding.submit({ topicSelections });
      } catch (err) {
        console.warn("Backend calibration sync note:", err.message);
      }
    }
  };

  const toggleThemeMode = () => {
    setState((s) => ({
      ...s,
      mode: s.mode === "light" ? "dark" : "light",
    }));
  };

  // Purchase or apply theme with backend API integration (/api/themes)
  const buyOrApplySkin = async (skinId) => {
    const skin = SKINS[skinId];
    if (!skin) return false;
    const owned = state.ownedSkins || ["default"];
    const isOwned = owned.includes(skinId);

    if (!isOwned) {
      if (state.coins < skin.price) {
        showToast(`Not enough coins! This theme requires ${skin.price} coins.`);
        return false;
      }

      // Try purchasing on backend if connected
      if (tokenStorage.get()) {
        try {
          const res = await api.themes.buyTheme(skinId);
          if (res?.coins !== undefined) {
            setState((s) => ({
              ...s,
              coins: res.coins,
              ownedSkins: [...owned, skinId],
              skin: skinId,
            }));
            setPreviewSkinId(null);
            showToast(`Purchased & applied ${skin.name} theme!`);
            return true;
          }
        } catch (apiErr) {
          console.warn("Backend theme buy fallback:", apiErr.message);
        }
      }

      // Local state fallback
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
      // Apply theme
      if (tokenStorage.get()) {
        try {
          await api.themes.applyTheme(skinId);
        } catch (apiErr) {
          console.warn("Backend theme apply fallback:", apiErr.message);
        }
      }

      setState((s) => ({
        ...s,
        skin: skinId,
      }));
      setPreviewSkinId(null);
      showToast(`Applied ${skin.name} theme.`);
      return true;
    }
  };

  // Open Problem in Solver with live backend templates & visible testcases if available
  const openProblemInSolver = async (problem) => {
    const slug = problem.slug || `prob-${problem.id}`;

    // Base fallback question structure
    let questionData = {
      topic: problem.t || problem.topic || "Arrays",
      l: problem.l ?? 0,
      difficulty: problem.l ?? 0,
      d: problem.d || 1200,
      title: `${problem.title} (${DIFFICULTY_LABELS[problem.l ?? 0]})`,
      text: `A ${DIFFICULTY_LABELS[problem.l ?? 0].toLowerCase()} ${problem.t || "DSA"} problem from the Calibr8 catalog. Solve it with optimal time and space complexity.`,
      ex: "Read constraints and implement the requested algorithm.",
      pts: problem.pts || [10, 25, 50][problem.l ?? 0],
      key: `c${problem.id}`,
      slug,
      hints: [
        "Think about what you must track as you scan the input.",
        "Name the pattern that keeps that information cheaply.",
        "Outline: set up, loop once, update the answer, return it.",
      ],
      trace: [["Step 1", "[init]", "0", "0", "0"]],
      stretch: false,
    };

    // Attempt to fetch full details & starter templates from backend (/api/problems/:slug)
    try {
      const res = await api.problems.getBySlug(slug);
      if (res?.data) {
        const d = res.data;
        questionData = {
          ...questionData,
          title: d.title ? `${d.title} (${d.difficulty})` : questionData.title,
          text: d.description || questionData.text,
          difficulty: d.difficulty === "Easy" ? 0 : d.difficulty === "Hard" ? 2 : 1,
          testcases: d.testcases || [],
          templates: d.templates || {},
        };
      }
    } catch {
      // Use local catalog data
    }

    setCurrentQ(questionData);
    setState((s) => ({ ...s, att: null }));
    setView("solve");
  };

  // --- Backend Authentication API Integration ---
  const login = async ({ email, password }) => {
    const res = await api.auth.login({ email, password });
    if (res?.success && res.user) {
      const u = res.user;
      setState((s) => ({
        ...s,
        user: u,
        name: u.name || s.name,
        college: u.college || s.college,
        rating: u.rating ?? s.rating,
        score: u.score ?? s.score,
        streak: u.streak ?? s.streak,
        coins: u.coins ?? s.coins,
        started: u.onboarded || s.started,
      }));
    }
    return res;
  };

  const register = async ({ name, email, password, role = "user" }) => {
    const res = await api.auth.register({ name, email, password, role });
    if (res?.success && res.user) {
      const u = res.user;
      setState((s) => ({
        ...s,
        user: u,
        name: u.name || s.name,
        college: u.college || s.college,
        rating: u.rating ?? s.rating,
        score: u.score ?? s.score,
        coins: u.coins ?? s.coins,
        started: u.onboarded || s.started,
      }));
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn("Backend logout note:", err.message);
    } finally {
      tokenStorage.remove();
      setState((s) => ({
        ...s,
        user: null,
      }));
    }
  };

  const refreshUser = async () => {
    const res = await api.users.getProfile();
    if (res?.success && res.user) {
      const u = res.user;
      setState((s) => ({
        ...s,
        user: u,
        name: u.name || s.name,
        college: u.college || s.college,
        rating: u.rating ?? s.rating,
        score: u.score ?? s.score,
        streak: u.streak ?? s.streak,
        coins: u.coins ?? s.coins,
      }));
      return u;
    }
    return null;
  };

  const updateProfileName = async (name) => {
    setState((s) => ({ ...s, name }));
    if (tokenStorage.get()) {
      try {
        const res = await api.users.updateName({ name });
        if (res?.user) {
          setState((s) => ({ ...s, user: { ...s.user, ...res.user } }));
        }
      } catch (err) {
        console.warn("Backend name update note:", err.message);
      }
    }
  };

  const updateAcademicProfile = async (academic) => {
    setState((s) => ({ ...s, ...academic }));
    if (tokenStorage.get()) {
      try {
        await api.users.updateAcademic(academic);
      } catch (err) {
        console.warn("Backend academic update note:", err.message);
      }
    }
  };

  const updateLanguage = async (language) => {
    setState((s) => ({ ...s, lang: language }));
    try {
      await api.onboarding.updateLanguage(language);
    } catch {
      try {
        await api.users.updateLanguage({ language });
      } catch (err) {
        console.warn("Backend language update note:", err.message);
      }
    }
  };

  const saveOnboarding = async (payload) => {
    try {
      const res = await api.onboarding.submit(payload);
      if (res?.user) {
        setState((s) => ({
          ...s,
          user: { ...s.user, ...res.user },
          started: true,
        }));
      }
      return res;
    } catch (err) {
      console.warn("Backend onboarding note:", err.message);
      return null;
    }
  };

  const exploreDemo = useCallback(() => {
    const dsaTopics = [
      "Arrays",
      "Strings",
      "Recursion",
      "Graphs",
      "Sliding Window",
      "DP",
      "Trees",
      "Linked List",
    ];
    const easyLevels = {};
    const easyRatings = {};
    dsaTopics.forEach((t) => {
      easyLevels[t] = 0; // 0 = Easy
      easyRatings[t] = 800; // 800 = Easy calibration rating
    });

    setState((s) => ({
      ...s,
      started: true,
      calibrating: false,
      rating: 800,
      score: s.score || 800,
      levels: easyLevels,
      ratings: easyRatings,
      lang: s.lang || "Python3",
      user: s.user || {
        guest: false,
        name: "Demo Learner",
        email: "demo@calibr8.local",
        difficulty: "easy",
        rating: 800,
      },
      view: "home",
    }));

    showToast("Demo started! All DSA topics set to Easy.");
  }, [showToast]);

  // Run code against backend execution sandbox (/api/execution/runs)
  const runCode = async ({ slug, problemId, language, code }) => {
    return await api.execution.run({ slug, problemId, language, code });
  };

  // Submit code for judging with backend polling (/api/execution/submissions)
  const submitCode = async ({ slug, problemId, language, code, onProgress }) => {
    const submission = await api.execution.submit({
      slug,
      problemId,
      language,
      code,
    });
    if (submission?.submissionId) {
      return await api.execution.pollSubmission(submission.submissionId, {
        onProgress,
      });
    }
    return submission;
  };

  return (
    <Calibr8Context.Provider
      value={{
        state,
        setState,
        user: state.user,
        setUser: (u) => setState((s) => ({ ...s, user: u })),
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
        // Backend API integrations
        backendConnected,
        login,
        register,
        logout,
        refreshUser,
        updateProfileName,
        updateAcademicProfile,
        updateLanguage,
        saveOnboarding,
        exploreDemo,
        runCode,
        submitCode,
        // Auth modal controls
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

export { useCalibr8 } from "./useCalibr8";
