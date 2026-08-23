import api from "../lib/api.js";

/**
 * @description Generate an interview report from a resume and job description.
 */
export const generateInterviewReport = async ({
  candidateProfile,
  jobDescriptionUrl,
  daysLimit,
}) => {
  const response = await api.post("/api/interview/reports", {
    candidateProfile,
    jobDescriptionUrl,
    daysLimit,
  });
  return response.data; // { jobId, status } or { reportId, status: 'completed' }
};

/**
 * @description Get the status of an interview generation job.
 */
export const getInterviewJobStatus = async (jobId) => {
  const response = await api.get(`/api/interview/reports/job/${jobId}`);
  return response.data; // { jobId, status, reportId, error }
};

/**
 * @description Get an interview report by ID.
 */
export const getInterviewReportById = async (reportId, options = {}) => {
  const response = await api.get(`/api/interview/reports/${reportId}`, {
    signal: options.signal,
  });
  return response.data;
};

/**
 * @description Get all interview reports.
 */
export const getAllInterviewReports = async (params = {}) => {
  const response = await api.get("/api/interview/reports", { params });
  return response.data; // {interviewReports, pagination}
};

export const getInterviewStats = async () => {
  const response = await api.get("/api/interview/reports/stats");
  return response.data; // {stats: { totalPlans, averageMatch, bestMatch }}
};


/**
 * @description Delete an interview report by ID.
 */
export const deleteInterviewReport = async (reportId) => {
  const response = await api.delete(`/api/interview/reports/${reportId}`);
  return response.data;
};

