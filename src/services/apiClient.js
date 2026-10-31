/**
 * Calibr8 Core HTTP Client & Request Interceptor
 *
 * Uses the same-origin Vite API proxy by default, or VITE_API_URL when configured:
 * - Automatic Authorization: Bearer <jwt-token> header injection
 * - Unified Error Handling conforming to API details.md Section 1.2
 * - No mock files or fallback intercepts; sends real HTTP requests
 */

import { apiConfig, tokenStorage, resolveUrl } from "./apiConfig.js";

export { apiConfig, tokenStorage, resolveUrl };

/**
 * Standard HTTP Request Client.
 *
 * @template T
 * @param {string} endpoint - API endpoint (e.g. "/problems", "/auth/login")
 * @param {RequestInit} [options] - Standard Fetch options
 * @returns {Promise<T>} Parsed response data
 */
export async function request(endpoint, options = {}) {
  const targetUrl = resolveUrl(endpoint);
  const headers = new Headers({ "Content-Type": "application/json" });
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));

  let trustedOrigin = window.location.origin;
  try {
    const configuredBase = apiConfig.getBaseUrl();
    trustedOrigin = new URL(
      configuredBase || window.location.origin,
      window.location.origin,
    ).origin;
  } catch {
    headers.delete("Authorization");
  }

  let targetOrigin;
  try {
    targetOrigin = new URL(targetUrl, window.location.origin).origin;
  } catch {
    headers.delete("Authorization");
  }

  if (targetOrigin !== trustedOrigin) {
    headers.delete("Authorization");
  } else {
    const token = tokenStorage.get();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

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
    if (response.status === 401) {
      tokenStorage.remove();
    }

    const message =
      (typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code || "REQUEST_FAILED";
    error.details = data?.details || {};
    error.data = data;
    throw error;
  }

  return data;
}

export default request;
