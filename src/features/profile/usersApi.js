/**
 * User Profile & Academic APIs (/api/users)
 * Conforms strictly to API details.md Section 6.
 */
import { request } from "../../services/apiClient";

export const usersApi = {
  /**
   * Get profile details and activity data in one request.
   * GET /api/users/me/overview (Protected)
   */
  getProfileOverview: async () => {
    return await request("/users/me/overview", { method: "GET" });
  },

  /**
   * Get user profile details.
   * GET /api/users/me (Protected: Bearer <token>)
   */
  getProfile: async () => {
    return await request("/users/me", { method: "GET" });
  },

  /**
   * Get daily fully accepted submission counts for the authenticated user.
   * GET /api/users/me/activity
   */
  getActivity: async () => {
    return await request("/users/me/activity", { method: "GET" });
  },

  /**
   * Update user display name.
   * PUT /api/users/me (Protected: Bearer <token>)
   */
  updateName: async ({ name }) => {
    return await request("/users/me", {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  },

  /**
   * Update the profile page's editable fields in one request.
   * PATCH /api/users/me (Protected)
   */
  updateProfile: async ({ name, college, branch, batch, state, country }) => {
    return await request("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name, college, branch, batch, state, country }),
    });
  },

  /**
   * Update preferred programming language.
   * PATCH /api/users/me/language (Protected: Bearer <token>)
   */
  updateLanguage: async ({ language }) => {
    return await request("/users/me/language", {
      method: "PATCH",
      body: JSON.stringify({ language }),
    });
  },

  /**
   * Update academic college / batch / region profile.
   * PATCH /api/users/me/academic (Protected: Bearer <token>)
   */
  updateAcademic: async ({ college, branch, batch, state, country }) => {
    return await request("/users/me/academic", {
      method: "PATCH",
      body: JSON.stringify({ college, branch, batch, state, country }),
    });
  },

  /**
   * Get problem solve status for user.
   * GET /api/users/all (Protected: Bearer <token>)
   */
  getSolvedProblems: async () => {
    return await request("/users/all", { method: "GET" });
  },
};

export default usersApi;
