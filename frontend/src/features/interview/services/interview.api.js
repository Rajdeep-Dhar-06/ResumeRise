import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

/**
 * @description Generate an interview report.
 */
export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
}) => {
  if (!resumeFile) {
    throw new Error("Resume file is required.");
  }

  try {
    const formData = new FormData(); // FormData to handle file upload
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);
    formData.append("resume", resumeFile);

    const response = await api.post("/api/interview", formData, {
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
export const getAllInterviewReports = async () => {
  try {
    const response = await api.get("/api/interview");
    return response.data;
  } catch (error) {
    console.error("Error fetching all interview reports:", error);
  }
};

/**
 * @description Download the resume PDF for a saved interview report.
 */
export const getResumePdf = async (interviewId) => {
  try {
    const response = await api.post(
      `/api/interview/resume/pdf/${interviewId}`,
      {},
      {
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error downloading resume PDF:", error);
    throw error;
  }
};
