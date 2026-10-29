/**
 * Calibr8 API Configuration & Token Storage
 * 
 * Centralized settings for backend connectivity conforming to API details.md:
 * - Backend Base URL: http://localhost:3000
 * - Global API Prefix: /api
 * - JWT Token Storage (Bearer authentication scheme)
 */

export const STORAGE_KEYS = {
  TOKEN: "calibr8_token",
  LEGACY_TOKEN: "token",
  BACKEND_URL: "calibr8_backend_url",
};

/**
 * Token management helper for JWT authentication.
 */
export const tokenStorage = {
  /**
   * Retrieve current stored JWT token.
   * @returns {string|null}
   */
  get: () => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.TOKEN) ||
        localStorage.getItem(STORAGE_KEYS.LEGACY_TOKEN) ||
        null
      );
    } catch {
      return null;
    }
  },

  /**
   * Save JWT token to local storage.
   * @param {string} token 
   */
  set: (token) => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.LEGACY_TOKEN, token);
      } else {
        tokenStorage.remove();
      }
    } catch (e) {
      console.error("[Calibr8] Failed to persist auth token:", e);
    }
  },

  /**
   * Clear JWT token from storage.
   */
  remove: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_TOKEN);
    } catch (e) {
      console.error("[Calibr8] Failed to remove auth token:", e);
    }
  },
};

/**
 * Backend base URL configuration.
 */
export const apiConfig = {
  /**
   * Determine the active backend base URL.
   * Checks localStorage override first, then VITE_API_URL, defaulting to the
   * current origin so local development can use Vite's API proxy.
   * @returns {string}
   */
  getBaseUrl: () => {
    try {
      const custom = localStorage.getItem(STORAGE_KEYS.BACKEND_URL);
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

    return "";
  },

  /**
   * Configure a custom backend URL at runtime (e.g. for development or testing).
   * @param {string|null} url 
   */
  setBaseUrl: (url) => {
    try {
      if (url && url.trim()) {
        localStorage.setItem(STORAGE_KEYS.BACKEND_URL, url.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.BACKEND_URL);
      }
    } catch {
      // ignore
    }
  },
};

/**
 * Resolves a route path to a fully qualified backend URL with `/api` prefix.
 * 
 * @param {string} endpoint - API route (e.g., "/auth/login", "/api/problems", "/health")
 * @returns {string} Fully resolved absolute URL
 */
export function resolveUrl(endpoint) {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  const baseUrl = apiConfig.getBaseUrl().replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Direct root/health/ping paths without /api
  if (
    cleanEndpoint === "/" ||
    cleanEndpoint === "/ping" ||
    cleanEndpoint === "/health"
  ) {
    return `${baseUrl}${cleanEndpoint}`;
  }

  // Ensure /api prefix is prepended
  const apiPath = cleanEndpoint.startsWith("/api")
    ? cleanEndpoint
    : `/api${cleanEndpoint}`;

  return `${baseUrl}${apiPath}`;
}

export default {
  tokenStorage,
  apiConfig,
  resolveUrl,
  STORAGE_KEYS,
};
