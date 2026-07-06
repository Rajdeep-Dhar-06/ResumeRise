import { useContext, useEffect } from "react";
import {
  generateInterviewReport,
  getInterviewReportById,
  getAllInterviewReports,
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

  useEffect(() => {
    if (!user) return;
    // 2. Kill the "Ghost": Clear the old report state as soon as the ID changes
    if (interviewId && report?._id !== interviewId) {
      setReport(null);
      getReportById(interviewId);
    } else if (!interviewId) {
      getReports();
    }
  }, [interviewId, getReportById, getReports, report?._id, setReport, user]); // Added proper dependencies

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
  };
};
