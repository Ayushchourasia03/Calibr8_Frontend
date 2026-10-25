/**
 * Themes & Personalization APIs (/api/themes)
 * Conforms strictly to API details.md Section 13.
 */
import { request } from "../../services/apiClient";

export const themesApi = {
  /**
   * List all themes.
   * GET /api/themes (Protected: Bearer <token>)
   */
  getAll: async () => {
    return await request("/themes", { method: "GET" });
  },

  /**
   * Get active theme & owned themes for current user.
   * GET /api/themes/me (Protected: Bearer <token>)
   */
  getMe: async () => {
    return await request("/themes/me", { method: "GET" });
  },

  /**
   * Apply an owned theme.
   * PUT /api/themes/apply (Protected: Bearer <token>)
   */
  applyTheme: async (slug) => {
    return await request("/themes/apply", {
      method: "PUT",
      body: JSON.stringify({ slug }),
    });
  },

  /**
   * Buy a theme using user coins.
   * POST /api/themes/:slug/buy (Protected: Bearer <token>)
   */
  buyTheme: async (slug) => {
    return await request(`/themes/${encodeURIComponent(slug)}/buy`, {
      method: "POST",
    });
  },
};

export default themesApi;
