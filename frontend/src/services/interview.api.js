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

  const response = await api.post("/api/interview/reports/generate-report", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * @description Poll status of a background report generation job.
 */
export const pollJobStatus = async (jobId, options = {}) => {
  const response = await api.get(`/api/interview/reports/status/${jobId}`, {
    signal: options.signal,
  });
  return response.data;
};


/**
 * @description Get an interview report by ID.
 */
export const getInterviewReportById = async (interviewId, options = {}) => {
  const response = await api.get(`/api/interview/reports/${interviewId}`, {
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
export const deleteInterviewReport = async (interviewId) => {
  const response = await api.delete(`/api/interview/reports/${interviewId}`);
  return response.data;
};

