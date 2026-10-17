const TOKEN_STORAGE_KEY = "calibr8_token";

export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save token to localStorage:", e);
    }
  },
  remove: () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to remove token from localStorage:", e);
    }
  },
};

export const apiConfig = {
  getBaseUrl: () => {
    try {
      const custom = localStorage.getItem("calibr8_backend_url");
      if (custom && custom.trim()) {
        return custom.trim().replace(/\/+$/, "");
      }
    } catch {
      // ignore
    }
    return (
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
      ""
    ).replace(/\/+$/, "");
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

function getRequestBaseUrl() {
  try {
    const custom = localStorage.getItem("calibr8_backend_url");
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, "");
    }
  } catch {
    // ignore
  }

  return import.meta.env.DEV ? "" : apiConfig.getBaseUrl();
}

async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = tokenStorage.get();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const baseUrl = getRequestBaseUrl();
  const targetUrl = endpoint.startsWith("http")
    ? endpoint
    : baseUrl
      ? `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
      : endpoint;

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      data?.message || data || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    register: async ({ name, email, password }) => {
      const res = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (res.token) {
        tokenStorage.set(res.token);
      }
      return res;
    },

    login: async ({ email, password }) => {
      const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.token) {
        tokenStorage.set(res.token);
      }
      return res;
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

    getMe: async () => {
      return await request("/auth/me", { method: "GET" });
    },

    changePassword: async ({ oldPassword, newPassword }) => {
      return await request("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
    },
  },

  profile: {
    getMe: async () => {
      return await request("/me", { method: "GET" });
    },

    updateMe: async ({ name }) => {
      return await request("/me", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
    },
  },

  topics: {
    getAll: async (category) => {
      const query = category ? `?category=${encodeURIComponent(category)}` : "";
      return await request(`/topics${query}`, { method: "GET" });
    },

    getDsa: async () => {
      return await request("/topics/dsa", { method: "GET" });
    },
  },

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
  },

  system: {
    health: async () => {
      return await request("/health", { method: "GET" });
    },

    ping: async () => {
      return await request("/ping", { method: "GET" });
    },

    getInfo: async () => {
      return await request("/", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    },
  },

     social: {
    getLinkUrl: async (provider) => {
      return await request(`/api/social/${provider}/link-url`, {
        method: "GET",
      });
    },
    unlink: async (provider) => {
      return await request(`/api/social/${provider}`, {
        method: "DELETE",
      });
    },
    // Optional: to check connected accounts without reloading /me
    getAccounts: async () => {
      return await request(`/api/social`, {
        method: "GET",
      });
    }
  }
};
