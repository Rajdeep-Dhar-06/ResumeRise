import api from "../lib/api.js";

export const generateInterviewReport = async ({
  resumeFile,
  jobDescriptionUrl,
  daysLimit,
}) => {
  try {
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
  } catch (error) {
    console.error("Error generating interview report:", error);
    throw error;
  }
};


/**
 * @description Get an interview report by ID.
 */
export const getInterviewReportById = async (interviewId) => {
  try {
    const response = await api.get(`/api/interview/report/${interviewId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching interview report by ID:", error);
  }
};

/**
 * @description Get all interview reports.
 */
export const getAllInterviewReports = async (params = {}) => {
  try {
    const response = await api.get("/api/interview", { params });
    return response.data; // {interviewReports, pagination}
  } catch (error) {
    console.error("Error fetching all interview reports:", error);
  }
};

export const getInterviewStats = async () => {
  try {
    const response = await api.get("/api/interview/stats");
    return response.data; // {stats: { totalPlans, averageMatch, bestMatch }}
  } catch (error) {
    console.error("Error fetching interview stats:", error);
  }
};


/**
 * @description Delete an interview report by ID.
 */
export const deleteInterviewReport = async (interviewId) => {
  try {
    const response = await api.delete(`/api/interview/report/${interviewId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting interview report:", error);
    throw error;
  }
};

/**
 * @description Check if an interview report with this resume and job posting combination already exists.
 */
export const checkDuplicatePlan = async ({ resumeHash, jobDescriptionUrl, daysLimit }) => {
  try {
    const response = await api.post("/api/interview/checkDuplicate", {
      resumeHash,
      jobDescriptionUrl,
      daysLimit,
    });
    return response.data;
  } catch (error) {
    console.error("Error checking duplicate plan:", error);
    throw error;
  }
};
