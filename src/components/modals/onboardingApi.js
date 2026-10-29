/**
 * Onboarding & Calibration APIs (/api/onboarding)
 * 
 * Conforms strictly to API details.md Section 8:
 * - Mode 1: Granular per-topic selection: { topicSelections: [{ topicId, difficulty }] }
 * - Mode 2: Global preset across all topics: { difficulty: "medium", topicIds: "all" }
 * - Mode 3: 1-Click Beginner preset: { beginner: true }
 */
import { request } from "../../services/apiClient";

export const onboardingApi = {
  /**
   * Submit skill calibration levels across any of the 3 supported payload modes.
   * POST /api/onboarding (Protected: Bearer <token>)
   * Alias: PUT /api/onboarding/levels
   * 
   * @param {Object} payload 
   * @param {Array<{topicId: string, difficulty: string}>} [payload.topicSelections] - Mode 1
   * @param {string} [payload.difficulty] - Mode 2
   * @param {string|"all"|string[]} [payload.topicIds] - Mode 2
   * @param {boolean} [payload.beginner] - Mode 3
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
   * Allowed values: cpp, c, java, python, javascript
   */
  updateLanguage: async (language) => {
    return await request("/onboarding/language", {
      method: "PATCH",
      body: JSON.stringify({ language }),
    });
  },
};

export default onboardingApi;
