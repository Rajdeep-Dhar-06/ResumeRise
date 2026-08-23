import { useContext, useEffect } from "react";
import {
  generateInterviewReport,
  getInterviewReportById,
  getAllInterviewReports,
  deleteInterviewReport,
  getInterviewJobStatus,
} from "../services/interview.api.js";
import { InterviewContext } from "../context/InterviewContext.jsx";
import { useAuth } from "./useAuth.js";
import { useParams } from "react-router";
import { useCallback, useState } from "react";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { isLoading, setIsLoading, report, setReport, reports, setReports } = context;
  const { user } = useAuth();
  const { reportId } = useParams();
  const [isDeleting, setIsDeleting] = useState(false);

  const [fetchError, setFetchError] = useState(null);

  /** @description Generate a new interview report by enqueuing a job and polling for completion. */
  const generateReport = async ({
    candidateProfile,
    jobDescriptionUrl,
    daysLimit,
  }) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await generateInterviewReport({
        candidateProfile,
        jobDescriptionUrl,
        daysLimit,
      });

      if (!response?.jobId) {
        throw new Error("Failed to queue interview report generation job.");
      }

      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 40; // 40 * 3s = 120s timeout
        
        const interval = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts) {
            clearInterval(interval);
            setIsLoading(false);
            reject(new Error("Generation timed out."));
            return;
          }
          
          try {
            const jobStatus = await getInterviewJobStatus(response.jobId);
            if (jobStatus.status === 'completed') {
              clearInterval(interval);
              setIsLoading(false);
              resolve({ reportId: jobStatus.reportId });
            } else if (jobStatus.status === 'failed') {
              clearInterval(interval);
              setIsLoading(false);
              reject(new Error(jobStatus.error || "Generation failed"));
            }
            // If waiting or active, continue polling on the next interval tick
          } catch (err) {
            clearInterval(interval);
            setIsLoading(false);
            reject(err);
          }
        }, 3000);
      });
    } catch (error) {
      console.error("Error generating report:", error);
      setIsLoading(false);
      throw error;
    }
  };

  /** @description Fetch a single interview report by ID and store it in context. */
  const getReportById = useCallback(
    async (id, options = {}) => {
      if (!id) return;
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await getInterviewReportById(id, options);
        setReport(response.interviewReport);
      } catch (error) {
        console.error("Error fetching report:", error);
        setFetchError(error.message || "Failed to load report");
      } finally {
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
    if (reportId && report?._id !== reportId) {
      setReport(null);
      getReportById(reportId, { signal: controller.signal });
    }
    
    return () => {
      controller.abort();
    };
  }, [reportId, getReportById, report?._id, setReport, user]);

  return {
    isLoading,
    report,
    reports,
    fetchError,
    generateReport,
    getReports,
    deleteReport,
    isDeleting,
  };
};
