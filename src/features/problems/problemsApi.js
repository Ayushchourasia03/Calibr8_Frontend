/**
 * Problems Catalogue APIs (/api/problems)
 * Conforms strictly to API details.md Section 9.
 */
import { request } from "../../services/apiClient";

export const problemsApi = {
  /**
   * List all problems with optional difficulty & search filters.
   * GET /api/problems
   */
  getAll: async ({ difficulty, search } = {}) => {
    const params = new URLSearchParams();
    if (difficulty) params.append("difficulty", difficulty);
    if (search) params.append("search", search);
    const query = params.toString() ? `?${params.toString()}` : "";
    return await request(`/problems${query}`, { method: "GET" });
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
