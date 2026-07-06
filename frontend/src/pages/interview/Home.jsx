import React, { useState, useRef, useEffect } from "react";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { useInterview } from "../../hooks/useInterview.js";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth.js";
import { Sparkles, LogOut } from "lucide-react";

import { DashboardStats } from '../../components/interview/DashboardStats'
import { CreatePlan } from '../../components/interview/CreatePlan'
import { RecentPlans } from '../../components/interview/RecentPlans'
import { parseResume, parseJobDescription } from "../../services/interview.api.js";

const MOTIVATIONAL_QUOTES = [
  "Trust in the process. You've got this!",
  "One step at a time. Every interview is a step forward.",
  "Every expert was once a beginner. Keep learning!",
  "Preparation breeds confidence.",
  "Believe in your skills and your journey.",
  "Focus on progress, not perfection.",
  "You are closer to landing your target role than you think.",
  "Success is where preparation and opportunity meet.",
  "Take a deep breath. We are building your perfect match roadmap...",
];

const Home = () => {
  const { loading, generateReport, reports } = useInterview();
  const { user, handleLogout } = useAuth();

  const [fileName, setFileName] = useState("");
  const resumeInputRef = useRef();
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  // Background Ingestion States
  const [resumeId, setResumeId] = useState("");
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const [jobDescriptionId, setJobDescriptionId] = useState("");
  const [parsingJobDescription, setParsingJobDescription] = useState(false);
  const [jobDescriptionError, setJobDescriptionError] = useState("");

  // Debounced Job Description Parsing
  useEffect(() => {
    if (!jobDescriptionUrl.trim()) {
      setJobDescriptionId("");
      setJobDescriptionError("");
      return;
    }

    const isValidUrl = jobDescriptionUrl.startsWith("http://") || jobDescriptionUrl.startsWith("https://");
    if (!isValidUrl) {
      setJobDescriptionError("URL must start with http:// or https://");
      setJobDescriptionId("");
      return;
    }

    setJobDescriptionError("");

    const timer = setTimeout(async () => {
      setParsingJobDescription(true);
      setJobDescriptionError("");
      setJobDescriptionId("");
      try {
        const data = await parseJobDescription(jobDescriptionUrl.trim());
        if (data && data.jobDescriptionId) {
          setJobDescriptionId(data.jobDescriptionId);
          toast.success(`Job description parsed successfully!`);
        } else {
          throw new Error("Invalid response from server.");
        }
      } catch (error) {
        const errMsg = error?.response?.data?.error || error.message || "Failed to parse job description.";
        setJobDescriptionError(errMsg);
      } finally {
        setParsingJobDescription(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [jobDescriptionUrl]);

  // Handle Resume Selection & Background Redaction
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setParsingResume(true);
    setResumeError("");
    setResumeId("");

    try {
      const data = await parseResume(file);
      if (data && data.resumeId) {
        setResumeId(data.resumeId);
        toast.success("Resume uploaded and anonymized.");
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (error) {
      const errMsg = error?.response?.data?.error || error.message || "Failed to parse resume.";
      setResumeError(errMsg);
    } finally {
      setParsingResume(false);
    }
  };

  // Clear Selected File
  const handleClearFile = () => {
    setFileName("");
    setResumeId("");
    setResumeError("");
    setParsingResume(false);
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
  };

  // Trigger Report Generation
  const handleGenerateReport = async () => {
    if (!resumeId || !jobDescriptionId) {
      toast.error("Please ensure both resume and job description are parsed without errors.");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("Generating your custom interview strategy...");

    try {
      const data = await generateReport({
        resumeId,
        jobDescriptionId,
      });

      if (!data || !data.interviewReport?._id) {
        throw new Error("Unable to generate interview report.");
      }

      toast.success("Interview report generated successfully.", { id: toastId });

      setTimeout(() => {
        navigate(`/interview/${data.interviewReport._id}`);
      }, 700);
    } catch (error) {
      setGenerating(false);
      toast.error(
        "Failed to generate report. Please try again.",
        { id: toastId }
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center">
      <LoadingScreen
        active={generating || (loading && (!reports || reports.length === 0))}
        minDelay={2500}
        quotes={MOTIVATIONAL_QUOTES}
        message={generating ? "Generating your custom interview strategy..." : "Loading your interview plans…"}
      />
      {/* Top Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 px-4 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-lg font-medium text-foreground">Welcome, <span className="text-primary">{user?.username || "Guest"}</span> !</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground bg-accent/20 hover:bg-accent border border-border rounded-lg transition-all cursor-pointer"
          >
            <LogOut size={15} />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-10 flex flex-col gap-8 w-full">
        {/* Dashboard: heading + quick stats */}
        <section id="dashboard" className="scroll-mt-20">
          <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Interview Preparation <span className="text-primary">Dashboard</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Generate tailored interview roadmaps and track your match scores in one place.
          </p>
          <div className="mt-6">
            <DashboardStats plans={reports} />
          </div>
        </section>

        {/* Create plan section */}
        <section id="create" className="scroll-mt-20">
          <h2 className="mb-5 text-2xl font-bold text-balance">
            Create Your Custom <span className="text-primary">Interview Plan</span>
          </h2>
          <CreatePlan
            jobDescriptionUrl={jobDescriptionUrl}
            setJobDescriptionUrl={setJobDescriptionUrl}
            fileName={fileName}
            setFileName={setFileName}
            resumeInputRef={resumeInputRef}
            handleFileChange={handleFileChange}
            handleGenerateReport={handleGenerateReport}
            loading={loading || generating}
            resumeId={resumeId}
            parsingResume={parsingResume}
            resumeError={resumeError}
            jobDescriptionId={jobDescriptionId}
            parsingJobDescription={parsingJobDescription}
            jobDescriptionError={jobDescriptionError}
            handleClearFile={handleClearFile}
          />
        </section>

        {/* Recent plans section */}
        {reports && reports.length > 0 && (
          <section id="plans" className="scroll-mt-20">
            <RecentPlans plans={reports} />
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;
