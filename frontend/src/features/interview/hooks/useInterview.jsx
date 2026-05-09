import { useContext, useEffect } from "react";
import {
  generateInterviewReport,
  getInterviewReportById,
  getAllInterviewReports,
} from "../services/interview.api.js";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
  const { loading, setLoading, report, setReport, reports, setReports } =
    useContext(InterviewContext);
  const { interviewId } = useParams();

  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
  }) => {
    setLoading(true);
    let response = null;
    try {
      response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });
      setReport(response.interviewReport);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
    return response;
  };

  const getReportById = async (id) => {
    setLoading(true);
    let response = null;
    try {
      response = await getInterviewReportById(id);
      setReport(response);
    } catch (error) {
      console.error("Error fetching report by ID:", error);
    } finally {
      setLoading(false);
    }
    return response;
  };

  const getReports = async () => {
    setLoading(true);
    let response = null;
    try {
      response = await getAllInterviewReports();
      setReports(response);
    } catch (error) {
      console.error("Error fetching all reports:", error);
    } finally {
      setLoading(false);
    }
    return response;
  };

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    } else {
      getReports();
    }
  }, [interviewId]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
  };
};
