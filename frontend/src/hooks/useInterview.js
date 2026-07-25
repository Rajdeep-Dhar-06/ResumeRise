import { useContext, useEffect } from "react";
import {
  generateInterviewReport,
  pollJobStatus,
  getInterviewReportById,
  getAllInterviewReports,
  deleteInterviewReport,
} from "../services/interview.api.js";
import { InterviewContext } from "../context/InterviewContext.jsx";
import { useAuth } from "./useAuth.js";
import { useParams } from "react-router";
import { useCallback, useState } from "react";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { isLoading, setIsLoading, report, setReport, reports, setReports } = context;
  const { user } = useAuth();
  const { interviewId } = useParams();
  const [isDeleting, setIsDeleting] = useState(false);

  /** @description Generate a new interview report from a resume and job description. */
  const generateReport = async ({
    resumeFile,
    jobDescriptionUrl,
    daysLimit,
  }, options = {}) => {
    setIsLoading(true);
    let response = null;
    try {
      response = await generateInterviewReport({
        resumeFile,
        jobDescriptionUrl,
        daysLimit,
      });

      // Handle duplicate report returned immediately
      if (response?.isDuplicate && response?.interviewReport) {
        setReport(response.interviewReport);
        return response;
      }

      // Handle async queued job
      if (response?.jobId) {
        const jobId = response.jobId;
        let isDone = false;

        while (!isDone) {
          if (options.signal?.aborted) return;
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (options.signal?.aborted) return;

          const pollRes = await pollJobStatus(jobId, options);

          if (pollRes.status === "completed") {
            isDone = true;
            const finalReportRes = await getInterviewReportById(pollRes.reportId, options);
            setReport(finalReportRes.interviewReport);
            return finalReportRes;
          }

          if (pollRes.status === "failed") {
            throw new Error(pollRes.failedReason || "Report generation failed");
          }
        }
      }
    } catch (error) {
        console.error("Error generating report:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
    return response;
  };

  /** @description Fetch a single interview report by ID and store it in context. */
  const getReportById = useCallback(
    async (id, options = {}) => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await getInterviewReportById(id, options);
        setReport(response.interviewReport);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching report:", error);
        setIsLoading(false);
      }
    },
    [setReport, setIsLoading],
  );

  /** @description Fetch all interview reports for the current user. */
  const getReports = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const response = await getAllInterviewReports(params);
      setReports(response.interviewReports);
      return response.pagination;
    } catch (error) {
      console.error("Error fetching all reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setReports, setIsLoading]);

  /** @description Delete an interview report by ID and remove it from context. */
  const deleteReport = useCallback(
    async (id) => {
      if (!id) return;
      setIsDeleting(true);
      try {
        await deleteInterviewReport(id);
        // Remove from reports list
        setReports((prev) => prev.filter((p) => p._id !== id));
        // Clear current report if it matches the deleted one
        setReport((prev) => (prev?._id === id ? null : prev));
      } catch (error) {
        console.error("Error deleting report:", error);
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [setReport, setReports],
  );

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController(); // abort previous requests

    // Clear the old report state as soon as the ID changes
    if (interviewId && report?._id !== interviewId) {
      setReport(null);
      getReportById(interviewId, { signal: controller.signal });
    }
    
    return () => {
      controller.abort();
    };
  }, [interviewId, getReportById, report?._id, setReport, user]);

  return {
    isLoading,
    report,
    reports,
    generateReport,
    getReports,
    deleteReport,
    isDeleting,
  };
};
