/**
 * Calibr8 Core HTTP Client & Request Interceptor
 * 
 * Uses the same-origin Vite API proxy by default, or VITE_API_URL when configured:
 * - Automatic Authorization: Bearer <jwt-token> header injection
 * - Unified Error Handling conforming to API details.md Section 1.2
 * - No mock files or fallback intercepts; sends real HTTP requests
 */

import { apiConfig, tokenStorage, resolveUrl } from "./apiConfig";

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
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Inject JWT Bearer Token if present
  const token = tokenStorage.get();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const targetUrl = resolveUrl(endpoint);

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
