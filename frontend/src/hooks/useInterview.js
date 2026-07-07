import { useContext, useEffect } from "react";
import {
  generateInterviewReport,
  getInterviewReportById,
  getAllInterviewReports,
  deleteInterviewReport,
} from "../services/interview.api.js";
import { InterviewContext } from "../context/InterviewContext.jsx";
import { useAuth } from "./useAuth.js";
import { useParams } from "react-router";
import { useCallback } from "react";

export const useInterview = () => {
  const { loading, setLoading, report, setReport, reports, setReports } =
    useContext(InterviewContext);
  const { user } = useAuth();
  const { interviewId } = useParams();

  /** @description Generate a new interview report from a resume and job description. */
  const generateReport = async ({
    resumeId,
    jobDescriptionId,
  }) => {
    setLoading(true);
    let response = null;
    try {
      response = await generateInterviewReport({
        resumeId,
        jobDescriptionId,
      });
      setReport(response.interviewReport);
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    } finally {
      setLoading(false);
    }
    return response;
  };

  /** @description Fetch a single interview report by ID and store it in context. */
  const getReportById = useCallback(
    async (id) => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await getInterviewReportById(id);
        setReport(response.interviewReport);
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
         setLoading(false);
      }
    },
    [setReport, setLoading],
  );

  /** @description Fetch all interview reports for the current user. */
  const getReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllInterviewReports();
      setReports(response.interviewReports);
    } catch (error) {
      console.error("Error fetching all reports:", error);
    } finally {
      setLoading(false);
    }
  }, [setReports, setLoading]);

  /** @description Delete an interview report by ID and remove it from context. */
  const deleteReport = useCallback(
    async (id) => {
      if (!id) return;
      setLoading(true);
      try {
        await deleteInterviewReport(id);
        // Remove from reports list
        setReports((prev) => prev.filter((p) => p._id !== id));
        // Clear current report if it matches the deleted one
        if (report?._id === id) {
          setReport(null);
        }
      } catch (error) {
        console.error("Error deleting report:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [report?._id, setReport, setReports, setLoading],
  );

  useEffect(() => {
    if (!user) return;
    // Clear the old report state as soon as the ID changes
    if (interviewId && report?._id !== interviewId) {
      setReport(null);
      getReportById(interviewId);
    } else if (!interviewId) {
      getReports();
    }
  }, [interviewId, getReportById, getReports, report?._id, setReport, user]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    deleteReport,
  };
};
