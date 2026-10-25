/**
 * Onboarding & Calibration APIs (/api/onboarding)
 * Conforms strictly to API details.md Section 8.
 */
import { request } from "../../services/apiClient";

export const onboardingApi = {
  /**
   * Submit skill calibration levels.
   * POST /api/onboarding (Protected: Bearer <token>)
   * Payload: { topicSelections: [{ topicId, difficulty }] } or { beginner: true }
   */
  submit: async (payload) => {
    return await request("/onboarding", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get onboarding status for current user.
   * GET /api/onboarding/status (Protected: Bearer <token>)
   */
  getStatus: async () => {
    return await request("/onboarding/status", { method: "GET" });
  },

  /**
   * Update onboarding primary language preference.
   * PATCH /api/onboarding/language (Protected: Bearer <token>)
   */
  updateLanguage: async (language) => {
    return await request("/onboarding/language", {
      method: "PATCH",
      body: JSON.stringify({ language }),
    });
  },
};

export default onboardingApi;
