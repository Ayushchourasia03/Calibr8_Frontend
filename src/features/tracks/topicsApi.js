/**
 * Topics & Categories APIs (/api/topics)
 * Conforms strictly to API details.md Section 7.
 */
import { request } from "../../services/apiClient";

export const topicsApi = {
  /**
   * List all calibration topics.
   * GET /api/topics (Protected: Bearer <token>)
   */
  getAll: async (category) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return await request(`/topics${query}`, { method: "GET" });
  },

  /**
   * List DSA calibration topics specifically.
   * GET /api/topics/dsa (Protected: Bearer <token>)
   */
  getDsa: async () => {
    return await request("/topics/dsa", { method: "GET" });
  },

  /**
   * List structured DSA categories.
   * GET /api/topics/categories (Protected: Bearer <token>)
   */
  getCategories: async () => {
    return await request("/topics/categories", { method: "GET" });
  },

  /**
   * Get problems in a specific DSA category.
   * GET /api/topics/dsa/:slug/problems
   */
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

  /**
   * Get topic by identifier (id or slug).
   * GET /api/topics/:identifier (Protected: Bearer <token>)
   */
  getByIdentifier: async (identifier) => {
    return await request(`/topics/${encodeURIComponent(identifier)}`, {
      method: "GET",
    });
  },
};

export default topicsApi;
