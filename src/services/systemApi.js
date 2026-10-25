/**
 * System & Health APIs
 * Conforms strictly to API details.md Section 4.
 */
import { request } from "./apiClient";

export const systemApi = {
  /**
   * Root API service manifest.
   * GET /
   */
  getInfo: () => request("/", { headers: { Accept: "application/json" } }),

  /**
   * Health status check.
   * GET /api/health or GET /health
   */
  health: () => request("/api/health"),

  /**
   * Ping / pong probe.
   * GET /api/ping or GET /ping
   */
  ping: () => request("/api/ping"),
};

export default systemApi;
