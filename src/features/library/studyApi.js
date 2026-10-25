/**
 * CS Curriculum & Study Material APIs (/api/study)
 * Conforms strictly to API details.md Section 12.
 */
import { request } from "../../services/apiClient";

export const studyApi = {
  /**
   * List all computer science subjects.
   * GET /api/study/subjects
   */
  getSubjects: async () => {
    return await request("/study/subjects", { method: "GET" });
  },

  /**
   * Get subject details & chapters.
   * GET /api/study/subjects/:subjectSlug
   */
  getSubject: async (subjectSlug) => {
    return await request(
      `/study/subjects/${encodeURIComponent(subjectSlug)}`,
      {
        method: "GET",
      },
    );
  },

  /**
   * Get topics in a chapter.
   * GET /api/study/chapters/:chapterId/topics
   */
  getChapterTopics: async (chapterId) => {
    return await request(
      `/study/chapters/${encodeURIComponent(chapterId)}/topics`,
      { method: "GET" },
    );
  },

  /**
   * Get study topic lesson and MCQs.
   * GET /api/study/topics/:topicSlug
   */
  getTopicDetail: async (topicSlug) => {
    return await request(`/study/topics/${encodeURIComponent(topicSlug)}`, {
      method: "GET",
    });
  },

  /**
   * Submit MCQ answers for evaluation.
   * POST /api/study/topics/:topicSlug/submit (Protected: Bearer <token>)
   */
  submitQuiz: async (topicSlug, answers) => {
    return await request(
      `/study/topics/${encodeURIComponent(topicSlug)}/submit`,
      {
        method: "POST",
        body: JSON.stringify({ answers }),
      },
    );
  },
};

export default studyApi;
