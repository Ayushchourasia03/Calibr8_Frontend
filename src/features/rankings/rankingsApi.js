/**
 * Rankings & Leaderboard APIs (/api/rankings)
 * Conforms strictly to API details.md Section 14.
 */
import { request } from "../../services/apiClient";

export const rankingsApi = {
  /**
   * Get leaderboard rankings with scope and regional filters.
   * GET /api/rankings
   */
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
};

export default rankingsApi;
