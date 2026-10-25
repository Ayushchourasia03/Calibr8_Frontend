/**
 * Calibr8 API Service Aggregator
 * Re-exports distributed API modules colocated across feature folders.
 * Conforms to API details.md specification.
 */
import { tokenStorage, apiConfig, request } from "./apiClient";
import { authApi } from "../features/auth/authApi";
import { usersApi } from "../features/profile/usersApi";
import { topicsApi } from "../features/tracks/topicsApi";
import { onboardingApi } from "../components/modals/onboardingApi";
import { problemsApi } from "../features/problems/problemsApi";
import { executionApi } from "../features/solve/executionApi";
import { socialApi } from "../features/profile/socialApi";
import { studyApi } from "../features/library/studyApi";
import { themesApi } from "../features/store/themesApi";
import { rankingsApi } from "../features/rankings/rankingsApi";
import { systemApi } from "./systemApi";

export { tokenStorage, apiConfig, request };
export { authApi } from "../features/auth/authApi";
export { usersApi } from "../features/profile/usersApi";
export { topicsApi } from "../features/tracks/topicsApi";
export { onboardingApi } from "../components/modals/onboardingApi";
export { problemsApi } from "../features/problems/problemsApi";
export { executionApi } from "../features/solve/executionApi";
export { socialApi } from "../features/profile/socialApi";
export { studyApi } from "../features/library/studyApi";
export { themesApi } from "../features/store/themesApi";
export { rankingsApi } from "../features/rankings/rankingsApi";
export { systemApi } from "./systemApi";

export const api = {
  auth: authApi,
  users: usersApi,
  profile: usersApi, // legacy alias
  topics: topicsApi,
  onboarding: onboardingApi,
  problems: problemsApi,
  execution: executionApi,
  social: socialApi,
  study: studyApi,
  themes: themesApi,
  rankings: rankingsApi,
  system: systemApi,
};

export default api;
