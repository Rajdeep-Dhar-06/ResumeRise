import { useState, useRef } from "react";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { useInterview } from "../../hooks/useInterview.js";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth.js";
import { Sparkles, LogOut, LayoutDashboard } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "../../lib/quotes.js";

import { Button } from "@/components/ui/button";
import { CreatePlan } from '../../components/interview/CreatePlan';


const Home = () => {
  // Custom Hooks & Context
  const { isLoading, generateReport } = useInterview();
  const { user, handleLogout, isLoggingOut } = useAuth();
  const navigate = useNavigate();

  // State: File upload handling
  const [fileName, setFileName] = useState("");
  const resumeInputRef = useRef();
  const [resumeFile, setResumeFile] = useState(null);
  
  // State: Form inputs
  const [careerTranscript, setCareerTranscript] = useState("");
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("");
  const [daysLimit, setDaysLimit] = useState(7);

  // State: UI toggles
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle Resume Selection
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Only PDF files are allowed.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("PDF size must be less than 3MB");
      return;
    }

    setFileName(file.name);
    setResumeFile(file);
  };

  // Clear Selected File
  const handleClearFile = () => {
    setFileName("");
    setResumeFile(null);
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
  };

  // Trigger Report Generation
  const handleGenerateReport = async () => {
    if (!jobDescriptionUrl.trim()) {
      toast.error("Please enter a job posting URL.");
      return;
    }
    if (!resumeFile) {
      toast.error("Please upload your resume (PDF).");
      return;
    }

    setIsGenerating(true);

    try {
      const data = await generateReport({
        resumeFile,
        careerTranscript: careerTranscript.trim(),
        jobDescriptionUrl: jobDescriptionUrl.trim(),
        daysLimit,
      });

      if (!data || !data.reportId) {
        throw new Error("Unable to generate interview report.");
      }

      toast.success("Interview strategy generated successfully!");
      navigate(`/interview/${data.reportId}`);
    } catch (error) {
      setIsGenerating(false);

      if (error?.response?.status === 409) {
        const existingId = error.response?.data?.details?.reportId;
        if (existingId) {
          toast.info("Existing plan found! Loading your report...");
          navigate(`/interview/${existingId}`);
          return;
        }
      }

      const errMsg = error?.response?.data?.error || error?.response?.data?.message || error.message || "Failed to generate report. Please try again.";
      toast.error(errMsg);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* ================= LOADING SCREEN ================= */}
      <LoadingScreen
        active={isGenerating}
        minDelay={2500}
        quotes={MOTIVATIONAL_QUOTES}
        message="Generating your custom interview strategy..."
      />
      {/* ================= TOP HEADER ================= */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 px-4 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-lg font-medium text-foreground">Welcome, <span className="text-primary">{user?.username || "Guest"}</span> !</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              render={<Link to="/dashboard" />}
              className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-semibold"
            >
              <LayoutDashboard size={15} />
              <span>My Dashboard</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-semibold"
            >
              <LogOut size={15} />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT: CREATE PLAN ================= */}
      <main className="grow mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-10 flex flex-col gap-6 md:gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Create Your Custom <span className="text-primary">Interview Plan</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Analyze job descriptions, upload your resume, and generate dynamic custom preparation roadmaps.
          </p>
        </div>

        <div className="grow flex flex-col justify-center">
          <CreatePlan
            jobDescriptionUrl={jobDescriptionUrl}
            setJobDescriptionUrl={setJobDescriptionUrl}
            fileName={fileName}
            setFileName={setFileName}
            resumeInputRef={resumeInputRef}
            handleFileChange={handleFileChange}
            handleClearFile={handleClearFile}
            hasFile={!!resumeFile}
            careerTranscript={careerTranscript}
            setCareerTranscript={setCareerTranscript}
            handleGenerateReport={handleGenerateReport}
            loading={isLoading || isGenerating}
            daysLimit={daysLimit}
            setDaysLimit={setDaysLimit}
          />
        </div>
      </main>
    </div>
  );
};

export default Home;
