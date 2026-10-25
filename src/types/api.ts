/**
 * Calibr8 API Type Definitions
 * Exact contract types from 'API details.md' Section 2.
 */

// --- Core User & Auth ---
export type SupportedLanguage = 'cpp' | 'c' | 'java' | 'python' | 'javascript';
export type UserDifficulty = 'easy' | 'medium' | 'hard';
export type UserTier =
  | 'Prism I'
  | 'Prism II'
  | 'Aurora I'
  | 'Aurora II'
  | 'Aurora III'
  | 'Eclipse I'
  | 'Eclipse II'
  | 'Eclipse III'
  | 'Zenith I'
  | 'Zenith II';

export interface SocialAccount {
  id: string;
  provider: 'github' | 'linkedin';
  username?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  profileUrl?: string;
  bio?: string;
  headline?: string;
  connectedAt?: string;
  stats?: {
    publicRepos?: number;
    followers?: number;
    following?: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  difficulty: UserDifficulty | null;
  rating: number;
  score: number;
  streak: number;
  strictPercent: number;
  tier: UserTier;
  college: string | null;
  branch: string | null;
  batch: string | null;
  state: string | null;
  country: string;
  coins: number;
  onboarded: boolean;
  preferredLanguage: SupportedLanguage;
  createdAt: string;
  updatedAt: string;
  socialAccounts?: SocialAccount[];
  topics?: UserTopicAssociation[];
}

export interface UserTopicAssociation {
  id: string;
  userId: string;
  topicId: string;
  level: 'easy' | 'medium' | 'hard';
  topic?: Topic;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// --- Topics ---
export interface Topic {
  id: string;
  slug: string;
  name: string;
  category: 'DSA' | 'CORE';
}

export interface DsaCategory {
  id: string;
  slug: string;
  name: string;
  order: number;
  totalProblems: number;
}

// --- Problems Catalogue ---
export interface ProblemListItem {
  id: string;
  problemNumber: number;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
  memoryLimit: number;
  _count: {
    testcases: number;
    templates: number;
  };
}

export interface TestCase {
  testIndex: number;
  isVisible: boolean;
  input: string;
  output: string;
  stdinSmall?: string;
  expectedSmall?: string;
}

export interface ProblemDetail {
  id: string;
  problemNumber: number;
  slug: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
  memoryLimit: number;
  testcases: TestCase[];
  templates: Record<SupportedLanguage, string>;
}

// --- Code Execution ---
export type ExecutionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Runtime Error'
  | 'Time Limit Exceeded';

export interface RunCaseResult {
  index: number;
  input: string;
  expected: string;
  actual: string;
  studentStdout: string;
  status: ExecutionStatus;
  timeMs: number;
  memoryKb: number;
  errorText?: string;
}

export interface RunResponse {
  success: boolean;
  status: ExecutionStatus;
  passedCount: number;
  totalCount: number;
  cases: RunCaseResult[];
}

export interface SubmissionQueuedResponse {
  success: boolean;
  submissionId: string;
  status: 'QUEUED';
  pollUrl: string;
  message: string;
}

export interface SubmissionDetail {
  id: string;
  problemId: string;
  language: SupportedLanguage;
  status:
    | 'QUEUED'
    | 'PROCESSING'
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'RUNTIME_ERROR'
    | 'TIME_LIMIT_EXCEEDED';
  passedCount: number;
  totalCount: number;
  time: string | null;
  memory: number | null;
  createdAt: string;
  problem: {
    slug: string;
    title: string;
  };
}

// --- Study Curriculum ---
export interface StudySubject {
  id: string;
  slug: 'cn' | 'dbms' | 'oops' | 'os' | 'system-design';
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  _count: {
    chapters: number;
  };
}

export interface StudyChapter {
  id: string;
  slug: string;
  name: string;
  subjectId: string;
  order: number;
  _count?: {
    topics: number;
  };
}

export interface StudyMCQ {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  order: number;
}

export interface StudyTopicDetail {
  id: string;
  slug: string;
  name: string;
  order: number;
  content: string;
  isPublished: boolean;
  chapter: {
    id: string;
    slug: string;
    name: string;
    subject: {
      slug: string;
      name: string;
    };
  };
  mcqs: StudyMCQ[];
}

export interface MCQEvaluationResult {
  mcqId: string;
  correct: boolean;
  userAnswer: number;
  correctIndex: number;
  explanation: string;
}

export interface StudyQuizSubmitResponse {
  success: boolean;
  totalQuestions: number;
  score: number;
  percentage: number;
  results: MCQEvaluationResult[];
}

// --- Themes ---
export interface Theme {
  id: string;
  slug: string;
  name: string;
  price: number;
  previewColor: string | null;
  isDefault: boolean;
  owned: boolean;
  applied: boolean;
  canAfford: boolean;
}

export interface ThemeStatusResponse {
  success: boolean;
  coins: number;
  activeTheme: string;
  ownedThemes: string[];
}

// --- Rankings ---
export interface RankedUser {
  id: string;
  name: string;
  score: number;
  rating: number;
  streak: number;
  strictPercent: number;
  tier: UserTier;
  college: string | null;
  branch: string | null;
  batch: string | null;
  state: string | null;
  country: string;
  createdAt: string;
}
