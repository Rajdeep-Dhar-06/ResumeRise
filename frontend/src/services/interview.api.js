import api from "../lib/api.js";

/**
 * @description Upload and parse a candidate's resume PDF.
 */
export const parseResume = async (resumeFile) => {
  if (!resumeFile) {
    throw new Error("Resume file is required.");
  }

  try {
    const formData = new FormData();
    formData.append("resume", resumeFile);

    const response = await api.post("/api/interview/parseResume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};

/**
 * @description Scrape and extract skills/requirements from a job posting URL.
 */
export const parseJobDescription = async (jobDescriptionUrl) => {
  if (!jobDescriptionUrl) {
    throw new Error("Job description URL is required.");
  }

  try {
    const response = await api.post("/api/interview/parseJobDescription", {
      jobDescriptionUrl,
    });
    return response.data;
  } catch (error) {
    console.error("Error parsing job description:", error);
    throw error;
  }
};

/**
 * @description Generate an interview report from pre-parsed resume and job description.
 */
export const generateInterviewReport = async ({
  resumeId,
  jobDescriptionId,
}) => {
  if (!resumeId || !jobDescriptionId) {
    throw new Error("Both resumeId and jobDescriptionId are required.");
  }

  try {
    const response = await api.post("/api/interview/generateReport", {
      resumeId,
      jobDescriptionId,
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
export const getAllInterviewReports = async () => {
  try {
    const response = await api.get("/api/interview");
    return response.data;
  } catch (error) {
    console.error("Error fetching all interview reports:", error);
  }
};
