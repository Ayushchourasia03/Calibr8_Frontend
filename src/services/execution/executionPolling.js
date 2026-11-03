/**
 * Calibr8 Execution Polling & Submission Lifecycle Controller
 * Conforms to PRD Section 9 & 10.
 *
 * Coordinates submission status polling, trailing asynchronous complexity
 * polling, network retry backoff, and submission recovery.
 */
import { executionApi } from "./executionApi";
import { ComplexityStatus } from "./executionTypes";

const SUBMISSION_STORAGE_PREFIX = "calibr8_active_sub_";

/**
 * Stores active submission info for recovery across refreshes/navigation.
 * @param {string} problemKey - Problem slug or ID
 * @param {Object} subData - Submission details { id, problemKey, language, submittedAt }
 */
export function saveActiveSubmission(problemKey, subData) {
  if (!problemKey || !subData?.id) return;
  try {
    sessionStorage.setItem(
      `${SUBMISSION_STORAGE_PREFIX}${problemKey}`,
      JSON.stringify({
        ...subData,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // SessionStorage may be restricted
  }
}

/**
 * Retrieves any pending submission for the given problem.
 * @param {string} problemKey
 * @returns {Object|null}
 */
export function getActiveSubmission(problemKey) {
  if (!problemKey) return null;
  try {
    const raw = sessionStorage.getItem(`${SUBMISSION_STORAGE_PREFIX}${problemKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Discard submissions older than 10 minutes as expired
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      clearActiveSubmission(problemKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clears active submission reference from storage upon completion or abandon.
 * @param {string} problemKey
 */
export function clearActiveSubmission(problemKey) {
  if (!problemKey) return;
  try {
    sessionStorage.removeItem(`${SUBMISSION_STORAGE_PREFIX}${problemKey}`);
  } catch {
    // Ignore
  }
}

/**
 * Polls a submission until execution reaches a terminal state, then seamlessly
 * transitions to a slower polling interval for asynchronous complexity analysis
 * if complexity is still pending.
 *
 * @param {string} submissionId - Backend submission ID
 * @param {Object} options
 * @param {Function} [options.onExecutionProgress] - Callback on every poll update
 * @param {Function} [options.onExecutionComplete] - Callback when verdict is reached
 * @param {Function} [options.onComplexityUpdate] - Callback when complexity resolves
 * @param {AbortSignal} [options.signal] - Abort signal to cancel polling on unmount
 * @param {number} [options.executionIntervalMs=1000] - Fast interval during execution
 * @param {number} [options.complexityIntervalMs=2000] - Slower interval for trailing complexity
 * @param {number} [options.maxExecutionAttempts=30] - Max polling cycles for code execution (~30s)
 * @param {number} [options.maxComplexityAttempts=15] - Max polling cycles for complexity (~30s)
 * @returns {Promise<Object>} Final complete submission result
 */
export async function pollSubmissionWithComplexity(
  submissionId,
  {
    onExecutionProgress,
    onExecutionComplete,
    onComplexityUpdate,
    signal,
    executionIntervalMs = 1000,
    complexityIntervalMs = 2000,
    maxExecutionAttempts = 30,
    maxComplexityAttempts = 15,
  } = {},
) {
  if (!submissionId) {
    throw new Error("Cannot poll without a submission ID.");
  }

  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 4;
  let latestSubmission = null;
  let executionResolved = false;

  // Phase 1: Execution Polling (Waiting for Verdict)
  for (let attempt = 0; attempt < maxExecutionAttempts; attempt++) {
    if (signal?.aborted) {
      throw new Error("Polling cancelled.");
    }

    try {
      latestSubmission = await executionApi.getSubmission(submissionId);
      consecutiveErrors = 0; // reset error counter on success
    } catch (err) {
      consecutiveErrors++;
      if (consecutiveErrors >= maxConsecutiveErrors) {
        throw new Error(
          err.message || "Failed to reach execution service after multiple retries.",
          { cause: err },
        );
      }
      // Bounded backoff retry
      await new Promise((r) => setTimeout(r, 1000 * consecutiveErrors));
      continue;
    }

    if (onExecutionProgress) {
      onExecutionProgress(latestSubmission);
    }

    if (latestSubmission.isTerminal) {
      executionResolved = true;
      if (onExecutionComplete) {
        onExecutionComplete(latestSubmission);
      }
      break;
    }

    await new Promise((r) => setTimeout(r, executionIntervalMs));
  }

  if (!executionResolved && !latestSubmission?.isTerminal) {
    throw new Error("Execution timed out waiting for submission verdict.");
  }

  // Phase 2: Trailing Asynchronous Complexity Polling
  // If complexity is still pending or missing, continue polling at a slower interval
  const complexityState = latestSubmission.complexity?.status;
  const needsComplexityPolling =
    !latestSubmission.complexity ||
    complexityState === ComplexityStatus.PENDING;

  if (needsComplexityPolling) {
    consecutiveErrors = 0;
    for (let cAttempt = 0; cAttempt < maxComplexityAttempts; cAttempt++) {
      if (signal?.aborted) break;

      await new Promise((r) => setTimeout(r, complexityIntervalMs));
      if (signal?.aborted) break;

      try {
        latestSubmission = await executionApi.getSubmission(submissionId);
      } catch {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) break;
        continue;
      }

      const currentComplexity = latestSubmission.complexity;
      if (onComplexityUpdate && currentComplexity) {
        onComplexityUpdate(currentComplexity);
      }

      if (
        currentComplexity &&
        currentComplexity.status !== ComplexityStatus.PENDING
      ) {
        break; // Complexity analysis has settled
      }
    }
  }

  return latestSubmission;
}
