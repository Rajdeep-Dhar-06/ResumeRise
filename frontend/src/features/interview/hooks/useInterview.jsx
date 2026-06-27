import { useContext, useEffect } from "react";
import {
  generateInterviewReport,
  getInterviewReportById,
  getAllInterviewReports,
  getResumePdf,
  scrapeJobDescriptionUrl,
} from "../services/interview.api.js";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";
import { useCallback } from "react";

import toast from "react-hot-toast";

export const useInterview = () => {
  const { loading, setLoading, report, setReport, reports, setReports } =
    useContext(InterviewContext);
  const { interviewId } = useParams();

  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
    jobDescriptionUrl,
    scrapedSkills,
    scrapedRequirements,
  }) => {
    setLoading(true);
    let response = null;
    try {
      response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
        jobDescriptionUrl,
        scrapedSkills,
        scrapedRequirements,
      });
      setReport(response.interviewReport);
    } catch (error) {
      console.error("Error generating report:", error);
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

  const downloadResumePdf = async (interviewReportId) => {
    if (!interviewReportId) return;
    setLoading(true);
    const toastId = toast.loading("Generating and downloading PDF resume...");
    try {
      const pdfBlob = await getResumePdf(interviewReportId);
      const pdfUrl = window.URL.createObjectURL(
        new Blob([pdfBlob], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `resume-${interviewReportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(pdfUrl);
      toast.success("Resume PDF downloaded!", { id: toastId });
    } catch (error) {
      console.error("Error downloading resume PDF:", error);
      toast.error("Failed to generate resume PDF. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 2. Kill the "Ghost": Clear the old report state as soon as the ID changes
    if (interviewId && report?._id !== interviewId) {
      setReport(null);
      getReportById(interviewId);
    } else if (!interviewId) {
      getReports();
    }
  }, [interviewId, getReportById, getReports, report?._id, setReport]); // Added proper dependencies

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf: downloadResumePdf,
    scrapeJobDescriptionUrl,
  };
};
