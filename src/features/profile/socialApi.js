/**
 * Social & GitHub OAuth APIs (/api/social)
 * Conforms strictly to API details.md Section 11.
 */
import { request } from "../../services/apiClient";

export const socialApi = {
  /**
   * Get OAuth Link URL for provider.
   * GET /api/social/:provider/link-url (Protected: Bearer <token>)
   */
  getLinkUrl: async (provider) => {
    return await request(`/social/${encodeURIComponent(provider)}/link-url`, {
      method: "GET",
    });
  },

  /**
   * Unlink a connected social provider account.
   * DELETE /api/social/:provider (Protected: Bearer <token>)
   */
  unlink: async (provider) => {
    return await request(`/social/${encodeURIComponent(provider)}`, {
      method: "DELETE",
    });
  },

  /**
   * List connected social accounts.
   * GET /api/social (Protected: Bearer <token>)
   */
  getAccounts: async () => {
    return await request("/social", { method: "GET" });
  },
};

export default socialApi;
