/**
 * Code Execution Sandbox APIs (/api/execution)
 * Conforms strictly to API details.md Section 10.
 */
import { request } from "../../services/apiClient";

export const executionApi = {
  /**
   * List supported execution languages and compilers.
   * GET /api/execution/languages (Protected: Bearer <token>)
   */
  getLanguages: async () => {
    return await request("/execution/languages", { method: "GET" });
  },

  /**
   * Synchronous test run on sample visible testcases.
   * POST /api/execution/runs (Protected: Bearer <token>)
   */
  run: async ({ slug, problemId, language, code }) => {
    if (!code || !code.trim()) {
      throw new Error("Code string is required.");
    }

    const cleanLang = (language || "python").toLowerCase().replace(/[^a-z0-9]/g, "");

    return await request("/execution/runs", {
      method: "POST",
      body: JSON.stringify({
        slug,
        problemId,
        language: cleanLang,
        code,
      }),
    });
  },

  /**
   * Asynchronous submit for full judging.
   * POST /api/execution/submissions (Protected: Bearer <token>)
   */
  submit: async ({ slug, problemId, language, code, idempotencyKey }) => {
    if (!code || !code.trim()) {
      throw new Error("Code string is required.");
    }

    const cleanLang = (language || "python").toLowerCase().replace(/[^a-z0-9]/g, "");
    const headers = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    return await request("/execution/submissions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        slug,
        problemId,
        language: cleanLang,
        code,
      }),
    });
  },

  /**
   * Poll submission status until verdict.
   * GET /api/execution/submissions/:id (Protected: Bearer <token>)
   */
  getSubmission: async (id) => {
    return await request(`/execution/submissions/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  },

  /**
   * Helper polling loop for submission resolution.
   */
  pollSubmission: async (
    id,
    { onProgress, maxAttempts = 20, intervalMs = 1000 } = {},
  ) => {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await executionApi.getSubmission(id);
      const sub = res?.submission || res;
      if (onProgress) {
        onProgress(sub);
      }
      if (
        sub &&
        sub.status &&
        sub.status !== "QUEUED" &&
        sub.status !== "PROCESSING"
      ) {
        return sub;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("Submission execution timed out. Please check again later.");
  },
};

export default executionApi;
