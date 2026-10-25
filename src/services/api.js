/**
 * Calibr8 API Service Client
 * Production-grade HTTP client interfacing with the backend on http://localhost:3000.
 * Conforms to the full specification in 'API details.md'.
 */

const TOKEN_STORAGE_KEY = "calibr8_token";

export const tokenStorage = {
  get: () => {
    try {
      return (
        localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem("token")
      );
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem("token");
      }
    } catch (e) {
      console.error("Failed to save token to localStorage:", e);
    }
  },
  remove: () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem("token");
    } catch (e) {
      console.error("Failed to remove token from localStorage:", e);
    }
  },
};

export const apiConfig = {
  /**
   * Retrieves the backend host base URL.
   * Priority:
   * 1. localStorage override ("calibr8_backend_url")
   * 2. VITE_API_URL or VITE_API_BASE_URL env vars
   * 3. Fallback: "http://localhost:3000"
   */
  getBaseUrl: () => {
    try {
      const custom = localStorage.getItem("calibr8_backend_url");
      if (custom && custom.trim()) {
        return custom.trim().replace(/\/+$/, "");
      }
    } catch {
      // ignore
    }

    const envUrl =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL);

    if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, "");
    }

    return "http://localhost:3000";
  },

  setBaseUrl: (url) => {
    try {
      if (url && url.trim()) {
        localStorage.setItem("calibr8_backend_url", url.trim());
      } else {
        localStorage.removeItem("calibr8_backend_url");
      }
    } catch {
      // ignore
    }
  },
};

/**
 * Resolves the full URL for a requested endpoint.
 * Ensures the global '/api' prefix is preserved according to API details.md.
 */
function resolveUrl(endpoint) {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  const baseUrl = apiConfig.getBaseUrl();
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // If endpoint is a root probe (e.g. "/" or "/ping" or "/health"), allow root path
  if (
    cleanEndpoint === "/" ||
    cleanEndpoint === "/ping" ||
    cleanEndpoint === "/health"
  ) {
    return `${cleanBase}${cleanEndpoint}`;
  }

  // Ensure /api prefix if not already present
  const apiPath = cleanEndpoint.startsWith("/api")
    ? cleanEndpoint
    : `/api${cleanEndpoint}`;

  return `${cleanBase}${apiPath}`;
}

/**
 * Universal Request Interceptor
 */
export async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = tokenStorage.get();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const targetUrl = resolveUrl(endpoint);

  let response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
    });
  } catch (networkError) {
    // Network failure (backend offline, CORS, or connection refused)
    const err = new Error(
      `Cannot connect to Calibr8 backend at ${targetUrl}. Please ensure the server on localhost:3000 is running.`,
    );
    err.isNetworkError = true;
    err.original = networkError;
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or revoked
      tokenStorage.remove();
    }
    const message =
      (typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code || "REQUEST_FAILED";
    error.data = data;
    throw error;
  }

  return data;
}

// --------------------------------------------------------------------------
// API Client Modules (Grouped matching API details.md)
// --------------------------------------------------------------------------

export const api = {
  // 4. System & Health APIs
  system: {
    getInfo: () => request("/", { headers: { Accept: "application/json" } }),
    health: () => request("/api/health"),
    ping: () => request("/api/ping"),
  },

  // 5. Authentication APIs (/api/auth)
  auth: {
    register: async ({ name, email, password, role = "user" }) => {
      const res = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      if (res?.token) {
        tokenStorage.set(res.token);
      }
      return res;
    },

    login: async ({ email, password }) => {
      const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res?.token) {
        tokenStorage.set(res.token);
      }
      return res;
    },

    getMe: async () => {
      return await request("/auth/me", { method: "GET" });
    },

    refresh: async () => {
      const res = await request("/auth/refresh", { method: "POST" });
      if (res?.token) {
        tokenStorage.set(res.token);
      }
      return res;
    },

    changePassword: async ({ currentPassword, newPassword, oldPassword }) => {
      return await request("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: currentPassword || oldPassword,
          newPassword,
        }),
      });
    },

    logout: async () => {
      try {
        await request("/auth/logout", { method: "POST" });
      } catch (err) {
        console.warn("Logout error:", err.message);
      } finally {
        tokenStorage.remove();
      }
      return { success: true };
    },
  },

  // 6. User Profile & Academic APIs (/api/users)
  users: {
    getProfile: async () => {
      return await request("/users/me", { method: "GET" });
    },

    updateName: async ({ name }) => {
      return await request("/users/me", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
    },

    updateLanguage: async ({ language }) => {
      return await request("/users/me/language", {
        method: "PATCH",
        body: JSON.stringify({ language }),
      });
    },

    updateAcademic: async ({ college, branch, batch, state, country }) => {
      return await request("/users/me/academic", {
        method: "PATCH",
        body: JSON.stringify({ college, branch, batch, state, country }),
      });
    },

    getSolvedProblems: async () => {
      return await request("/users/all", { method: "GET" });
    },
  },

  // Legacy profile alias for backward compatibility
  profile: {
    getMe: async () => request("/users/me", { method: "GET" }),
    updateMe: async ({ name }) =>
      request("/users/me", { method: "PUT", body: JSON.stringify({ name }) }),
  },

  // 7. Topics & Categories APIs (/api/topics)
  topics: {
    getAll: async (category) => {
      const query = category ? `?category=${encodeURIComponent(category)}` : "";
      return await request(`/topics${query}`, { method: "GET" });
    },

    getDsa: async () => {
      return await request("/topics/dsa", { method: "GET" });
    },

    getCategories: async () => {
      return await request("/topics/categories", { method: "GET" });
    },

    getCategoryProblems: async (slug, { difficulty, search } = {}) => {
      const params = new URLSearchParams();
      if (difficulty) params.append("difficulty", difficulty);
      if (search) params.append("search", search);
      const query = params.toString() ? `?${params.toString()}` : "";
      return await request(
        `/topics/dsa/${encodeURIComponent(slug)}/problems${query}`,
        {
          method: "GET",
        },
      );
    },

    getByIdentifier: async (identifier) => {
      return await request(`/topics/${encodeURIComponent(identifier)}`, {
        method: "GET",
      });
    },
  },

  // 8. Onboarding & Calibration APIs (/api/onboarding)
  onboarding: {
    submit: async (payload) => {
      return await request("/onboarding", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    getStatus: async () => {
      return await request("/onboarding/status", { method: "GET" });
    },

    updateLanguage: async (language) => {
      return await request("/onboarding/language", {
        method: "PATCH",
        body: JSON.stringify({ language }),
      });
    },
  },

  // 9. Problems Catalogue APIs (/api/problems)
  problems: {
    getAll: async ({ difficulty, search } = {}) => {
      const params = new URLSearchParams();
      if (difficulty) params.append("difficulty", difficulty);
      if (search) params.append("search", search);
      const query = params.toString() ? `?${params.toString()}` : "";
      return await request(`/problems${query}`, { method: "GET" });
    },

    getBySlug: async (slugOrNumber) => {
      return await request(`/problems/${encodeURIComponent(slugOrNumber)}`, {
        method: "GET",
      });
    },
  },

  // 10. Code Execution Sandbox APIs (/api/execution)
  execution: {
    getLanguages: async () => {
      return await request("/execution/languages", { method: "GET" });
    },

    run: async ({ slug, problemId, language, code }) => {
      return await request("/execution/runs", {
        method: "POST",
        body: JSON.stringify({
          slug,
          problemId,
          language: language.toLowerCase().replace(/[^a-z]/g, ""),
          code,
        }),
      });
    },

    submit: async ({ slug, problemId, language, code, idempotencyKey }) => {
      const headers = {};
      if (idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
      }
      return await request("/execution/submissions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          slug,
          problemId,
          language: language.toLowerCase().replace(/[^a-z]/g, ""),
          code,
        }),
      });
    },

    getSubmission: async (id) => {
      return await request(`/execution/submissions/${encodeURIComponent(id)}`, {
        method: "GET",
      });
    },

    pollSubmission: async (
      id,
      { onProgress, maxAttempts = 20, intervalMs = 1000 } = {},
    ) => {
      for (let i = 0; i < maxAttempts; i++) {
        const res = await api.execution.getSubmission(id);
        const sub = res?.submission || res;
        if (onProgress) {
          onProgress(sub);
        }
        if (
          sub &&
          sub.status &&
          sub.status !== "QUEUED" &&
          sub.status !== "PROCESSING"
        ) {
          return sub;
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      throw new Error(
        "Submission execution timed out. Please check again later.",
      );
    },
  },

  // 11. Social & GitHub OAuth APIs (/api/social)
  social: {
    getLinkUrl: async (provider) => {
      return await request(`/social/${encodeURIComponent(provider)}/link-url`, {
        method: "GET",
      });
    },

    unlink: async (provider) => {
      return await request(`/social/${encodeURIComponent(provider)}`, {
        method: "DELETE",
      });
    },

    getAccounts: async () => {
      return await request("/social", { method: "GET" });
    },
  },

  // 12. CS Curriculum & Study Material APIs (/api/study)
  study: {
    getSubjects: async () => {
      return await request("/study/subjects", { method: "GET" });
    },

    getSubject: async (subjectSlug) => {
      return await request(
        `/study/subjects/${encodeURIComponent(subjectSlug)}`,
        {
          method: "GET",
        },
      );
    },

    getChapterTopics: async (chapterId) => {
      return await request(
        `/study/chapters/${encodeURIComponent(chapterId)}/topics`,
        { method: "GET" },
      );
    },

    getTopicDetail: async (topicSlug) => {
      return await request(`/study/topics/${encodeURIComponent(topicSlug)}`, {
        method: "GET",
      });
    },

    submitQuiz: async (topicSlug, answers) => {
      return await request(
        `/study/topics/${encodeURIComponent(topicSlug)}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
        },
      );
    },
  },

  // 13. Themes & Personalization APIs (/api/themes)
  themes: {
    getAll: async () => {
      return await request("/themes", { method: "GET" });
    },

    getMe: async () => {
      return await request("/themes/me", { method: "GET" });
    },

    applyTheme: async (slug) => {
      return await request("/themes/apply", {
        method: "PUT",
        body: JSON.stringify({ slug }),
      });
    },

    buyTheme: async (slug) => {
      return await request(`/themes/${encodeURIComponent(slug)}/buy`, {
        method: "POST",
      });
    },
  },

  // 14. Rankings & Leaderboard APIs (/api/rankings)
  rankings: {
    getRankings: async ({
      scope,
      college,
      batch,
      state,
      country,
      limit = 50,
    } = {}) => {
      const params = new URLSearchParams();
      if (scope) params.append("scope", scope);
      if (college) params.append("college", college);
      if (batch) params.append("batch", batch);
      if (state) params.append("state", state);
      if (country) params.append("country", country);
      if (limit) params.append("limit", String(limit));
      const query = params.toString() ? `?${params.toString()}` : "";
      return await request(`/rankings${query}`, { method: "GET" });
    },
  },
};

export default api;
