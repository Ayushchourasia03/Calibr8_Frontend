/**
 * Problems Catalogue APIs (/api/problems)
 * Conforms strictly to API details.md Section 9.
 */
import { request } from "../../services/apiClient";

export const problemsApi = {
  /**
   * List problems with optional catalog filters.
   * GET /api/problems
   */
  getAll: async ({ difficulty, search, topic, status, signal } = {}) => {
    const params = new URLSearchParams();
    if (difficulty) params.append("difficulty", difficulty);
    if (search) params.append("search", search);
    if (topic) params.append("topic", topic);
    if (status) params.append("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    return await request(`/problems${query}`, { method: "GET", signal });
  },

  /**
   * Get problem details & starter templates by slug or problem number.
   * GET /api/problems/:slug
   */
  getBySlug: async (slugOrNumber) => {
    return await request(`/problems/${encodeURIComponent(slugOrNumber)}`, {
      method: "GET",
    });
  },
};

export default problemsApi;
