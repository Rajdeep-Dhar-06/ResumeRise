import api from "../lib/api.js";

/**
 * @description Generate an interview report from a resume and job description.
 */
export const generateInterviewReport = async ({
  resumeFile,
  jobDescriptionUrl,
  daysLimit,
}) => {
  const formData = new FormData();
  if (resumeFile) {
    formData.append("resume", resumeFile);
  }
  if (jobDescriptionUrl) {
    formData.append("jobDescriptionUrl", jobDescriptionUrl);
  }
  if (daysLimit) {
    formData.append("daysLimit", daysLimit.toString());
  }

  const response = await api.post("/api/interview/generateReport", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};


/**
 * @description Get an interview report by ID.
 */
export const getInterviewReportById = async (interviewId) => {
  const response = await api.get(`/api/interview/report/${interviewId}`);
  return response.data;
};

/**
 * @description Get all interview reports.
 */
export const getAllInterviewReports = async (params = {}) => {
  const response = await api.get("/api/interview", { params });
  return response.data; // {interviewReports, pagination}
};

export const getInterviewStats = async () => {
  const response = await api.get("/api/interview/stats");
  return response.data; // {stats: { totalPlans, averageMatch, bestMatch }}
};


/**
 * @description Delete an interview report by ID.
 */
export const deleteInterviewReport = async (interviewId) => {
  const response = await api.delete(`/api/interview/report/${interviewId}`);
  return response.data;
};

/**
 * @description Check if an interview report with this resume and job posting combination already exists.
 */
export const checkDuplicatePlan = async ({ resumeHash, jobDescriptionUrl, daysLimit }) => {
  const response = await api.post("/api/interview/checkDuplicate", {
    resumeHash,
    jobDescriptionUrl,
    daysLimit,
  });
  return response.data;
};
