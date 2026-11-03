/**
 * Centralized Execution API Service
 * Conforms to PRD Section 4 and API details.md Section 10.
 *
 * Provides batch-only execution endpoints, submission status polling,
 * and asynchronous complexity analysis.
 */
import { request } from "../apiClient";
import { normalizeSubmission } from "./executionTypes";

export const executionApi = {
  /**
   * List supported execution languages and compilers.
   * GET /api/execution/languages
   */
  getLanguages: async () => {
    return await request("/execution/languages", { method: "GET" });
  },

  /**
   * Run code against visible testcases.
   * POST /api/execution/run
   *
   * @param {Object} params
   * @param {string} params.slug - Problem slug
   * @param {string} [params.problemId] - Problem ID
   * @param {string} params.language - Language key (cpp, c, java, python, javascript)
   * @param {string} params.code - Source code string
   * @param {boolean} [params.wait=true] - Hold request for synchronous return if supported
   */
  run: async ({ slug, problemId, language, code, wait = true }) => {
    if (!code || !code.trim()) {
      throw new Error("Code string is required.");
    }

    const cleanLang = (language || "python").toLowerCase().replace(/[^a-z0-9]/g, "");

    const res = await request("/execution/run", {
      method: "POST",
      body: JSON.stringify({
        slug,
        problemId,
        language: cleanLang,
        code,
        wait,
      }),
    });

    return normalizeSubmission(res);
  },

  /**
   * Submit code for full multi-tier evaluation against all testcases.
   * POST /api/execution/submit
   *
   * @param {Object} params
   * @param {string} params.slug - Problem slug
   * @param {string} [params.problemId] - Problem ID
   * @param {string} params.language - Language key
   * @param {string} params.code - Source code string
   * @param {string} [params.idempotencyKey] - Optional UUID to prevent duplicate execution
   * @param {boolean} [params.wait=false] - Hold connection until complete
   */
  submit: async ({ slug, problemId, language, code, idempotencyKey, wait = false }) => {
    if (!code || !code.trim()) {
      throw new Error("Code string is required.");
    }

    const cleanLang = (language || "python").toLowerCase().replace(/[^a-z0-9]/g, "");
    const headers = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const res = await request("/execution/submit", {
      method: "POST",
      headers,
      body: JSON.stringify({
        slug,
        problemId,
        language: cleanLang,
        code,
        wait,
      }),
    });

    return normalizeSubmission(res);
  },

  /**
   * Retrieve execution status, verdict, and complexity result.
   * GET /api/execution/submissions/:id
   *
   * @param {string} id - Submission ID
   */
  getSubmission: async (id) => {
    if (!id) throw new Error("Submission ID is required.");
    const res = await request(`/execution/submissions/${encodeURIComponent(id)}`, {
      method: "GET",
    });
    return normalizeSubmission(res);
  },

  /**
   * Standalone complexity analysis endpoint.
   * POST /api/execution/analyze-complexity
   *
   * @param {Object} params
   * @param {string} params.language
   * @param {string} params.code
   */
  analyzeComplexity: async ({ language, code }) => {
    if (!code || !code.trim()) {
      throw new Error("Code string is required.");
    }
    const cleanLang = (language || "python").toLowerCase().replace(/[^a-z0-9]/g, "");
    return await request("/execution/analyze-complexity", {
      method: "POST",
      body: JSON.stringify({ language: cleanLang, code }),
    });
  },
};

export default executionApi;
