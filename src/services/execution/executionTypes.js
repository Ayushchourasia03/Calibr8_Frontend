/**
 * Calibr8 Execution Types & Normalization Utilities
 *
 * Conforms to PRD Section 4.3, 6, 7, 8 and API details.md Section 10.
 * Normalizes execution responses, verdicts, runtime, memory, and complexity models.
 */

export const ExecutionStage = {
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  EVALUATING: "EVALUATING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  TIMEOUT: "TIMEOUT",
};

export const Verdict = {
  ACCEPTED: "ACCEPTED",
  WRONG_ANSWER: "WRONG_ANSWER",
  RUNTIME_ERROR: "RUNTIME_ERROR",
  TIME_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
  MEMORY_LIMIT_EXCEEDED: "MEMORY_LIMIT_EXCEEDED",
  COMPILATION_ERROR: "COMPILATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

export const ComplexityStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  LOW_CONFIDENCE: "low_confidence",
  UNKNOWN: "unknown",
  UNAVAILABLE: "unavailable",
};

/**
 * Human-friendly label for execution backend states.
 * @param {string} status
 * @returns {string}
 */
export function getStatusDisplay(status) {
  const norm = String(status || "").toUpperCase();
  switch (norm) {
    case "QUEUED":
      return "Waiting in queue";
    case "PROCESSING":
      return "Executing code";
    case "EVALUATING":
      return "Checking results";
    case "COMPLETED":
    case "ACCEPTED":
      return "Result available";
    case "TIMEOUT":
    case "TIME_LIMIT_EXCEEDED":
      return "Execution timed out";
    case "FAILED":
    case "RUNTIME_ERROR":
      return "Execution failed";
    default:
      return status || "In progress";
  }
}

/**
 * Normalizes runtime measurement into standard milliseconds display.
 * @param {number|string} time
 * @returns {string} e.g. "42 ms" or "N/A"
 */
export function formatRuntime(time) {
  if (time === null || time === undefined || time === "") return "N/A";
  if (typeof time === "string") {
    const trimmed = time.trim();
    if (trimmed.toLowerCase().endsWith("ms")) return trimmed;
    const num = parseFloat(trimmed);
    return isNaN(num) ? trimmed : `${Math.round(num)} ms`;
  }
  if (typeof time === "number" && !isNaN(time)) {
    return `${Math.round(time)} ms`;
  }
  return "N/A";
}

/**
 * Normalizes memory measurement into consistent human-readable unit (MB or KB).
 * @param {number|string} memory - Memory in KB or string
 * @returns {string} e.g. "13.4 MB" or "N/A"
 */
export function formatMemory(memory) {
  if (memory === null || memory === undefined || memory === "") return "N/A";
  if (typeof memory === "string") {
    const trimmed = memory.trim();
    if (trimmed.toLowerCase().endsWith("mb") || trimmed.toLowerCase().endsWith("kb")) {
      return trimmed;
    }
    const num = parseFloat(trimmed);
    if (isNaN(num)) return trimmed;
    memory = num;
  }
  if (typeof memory === "number" && !isNaN(memory)) {
    if (memory >= 1024) {
      return `${(memory / 1024).toFixed(1)} MB`;
    }
    return `${Math.round(memory)} KB`;
  }
  return "N/A";
}

/**
 * Normalizes complexity analysis response.
 * @param {Object} rawComplexity
 * @returns {Object} Normalized complexity model
 */
export function normalizeComplexity(rawComplexity) {
  if (!rawComplexity) {
    return {
      status: ComplexityStatus.PENDING,
      time: { bestEstimate: null, confidence: "unknown", evidence: [] },
      space: { bestEstimate: null, confidence: "unknown", evidence: [] },
      summary: null,
      analyzedAt: null,
    };
  }

  const timeEst = rawComplexity.time?.bestEstimate || rawComplexity.timeComplexity || null;
  const timeConf = (rawComplexity.time?.confidence || "unknown").toLowerCase();
  const timeEvidence = Array.isArray(rawComplexity.time?.evidence)
    ? rawComplexity.time.evidence
    : [];

  const spaceEst = rawComplexity.space?.bestEstimate || rawComplexity.spaceComplexity || null;
  const spaceConf = (rawComplexity.space?.confidence || "unknown").toLowerCase();
  const spaceEvidence = Array.isArray(rawComplexity.space?.evidence)
    ? rawComplexity.space.evidence
    : [];

  let status = ComplexityStatus.COMPLETED;
  if (rawComplexity.status === "pending" || (!timeEst && !spaceEst && !rawComplexity.error)) {
    status = ComplexityStatus.PENDING;
  } else if (rawComplexity.status === "failed" || rawComplexity.error || rawComplexity.unavailable) {
    status = ComplexityStatus.UNAVAILABLE;
  } else if (
    (timeEst && timeEst.toLowerCase().includes("unable")) ||
    (spaceEst && spaceEst.toLowerCase().includes("unable")) ||
    timeConf === "unknown"
  ) {
    status = ComplexityStatus.UNKNOWN;
  } else if (timeConf === "low" || spaceConf === "low") {
    status = ComplexityStatus.LOW_CONFIDENCE;
  }

  const combinedEvidence = Array.from(
    new Set([...timeEvidence, ...spaceEvidence, ...(rawComplexity.evidence || [])]),
  );

  return {
    status,
    time: {
      bestEstimate: timeEst || "Unable to determine",
      confidence: timeConf,
      evidence: timeEvidence,
    },
    space: {
      bestEstimate: spaceEst || "Unable to determine",
      confidence: spaceConf,
      evidence: spaceEvidence,
    },
    summary: rawComplexity.summary || `Time: ${timeEst || "N/A"}, Space: ${spaceEst || "N/A"}`,
    evidence: combinedEvidence,
    analyzedAt: rawComplexity.analyzedAt || null,
  };
}

/**
 * Normalizes a submission response payload from the backend.
 * Anti-leak security: Hidden testcases never expose input or expected output.
 *
 * @param {Object} rawSubmission
 * @returns {Object} Normalized submission model
 */
export function normalizeSubmission(rawSubmission) {
  if (!rawSubmission) return null;

  const data = rawSubmission.submission || rawSubmission;
  const rawStatus = (data.status || data.verdict || "UNKNOWN").toUpperCase();
  const isTerminal = [
    "ACCEPTED",
    "WRONG_ANSWER",
    "RUNTIME_ERROR",
    "TIME_LIMIT_EXCEEDED",
    "MEMORY_LIMIT_EXCEEDED",
    "COMPILATION_ERROR",
    "INTERNAL_ERROR",
    "COMPLETED",
  ].includes(rawStatus);

  const rawCases = data.cases || data.results || [];
  const normalizedCases = rawCases.map((tc, idx) => {
    const isHidden = tc.isVisible === false;
    const passed =
      tc.passed ?? (String(tc.status || "").toLowerCase() === "accepted");

    return {
      index: tc.index ?? tc.testIndex ?? idx,
      testIndex: tc.testIndex ?? idx,
      isVisible: !isHidden,
      passed,
      status: tc.status || (passed ? "Accepted" : "Failed"),
      timeMs: tc.timeMs ?? tc.time ?? null,
      memoryKb: tc.memoryKb ?? tc.memory ?? null,
      errorText: tc.errorText || null,
      // Anti-leak protection: Strictly nullify hidden testcase data
      input: isHidden ? null : (tc.input ?? tc.stdinSmall ?? null),
      expected: isHidden ? null : (tc.expected ?? tc.expectedSmall ?? null),
      actual: isHidden ? null : (tc.actual ?? tc.studentStdout ?? null),
      studentStdout: isHidden ? null : (tc.studentStdout ?? null),
    };
  });

  const passedCount =
    data.passedCount ??
    normalizedCases.filter((c) => c.passed).length;
  const totalCount =
    data.totalCount ??
    normalizedCases.length;

  return {
    id: data.id || data.submissionId || null,
    problemId: data.problemId || null,
    language: data.language || "python",
    status: rawStatus,
    verdict: data.verdict || rawStatus,
    isTerminal,
    passedCount,
    totalCount,
    time: formatRuntime(data.time ?? data.timeMs),
    rawTimeMs: data.timeMs ?? (typeof data.time === "number" ? data.time : null),
    memory: formatMemory(data.memory ?? data.memoryKb),
    rawMemoryKb: data.memoryKb ?? (typeof data.memory === "number" ? data.memory : null),
    tierReached: data.tierReached || null,
    reward: data.reward || null,
    rewardError: Boolean(data.rewardError),
    cases: normalizedCases,
    complexity: data.complexity ? normalizeComplexity(data.complexity) : null,
    createdAt: data.createdAt || new Date().toISOString(),
    problem: data.problem || null,
    firstFailure: data.firstFailure || null,
  };
}
