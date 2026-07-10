import { useState, useRef, useEffect } from "react";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { useInterview } from "../../hooks/useInterview.js";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth.js";
import { Sparkles, LogOut, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreatePlan } from '../../components/interview/CreatePlan'
import { MOTIVATIONAL_QUOTES } from "../../lib/quotes.js";


const Home = () => {
  const { loading, generateReport, checkDuplicatePlan } = useInterview();
  const { user, handleLogout } = useAuth();

  const [fileName, setFileName] = useState("");
  const resumeInputRef = useRef();
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [daysLimit, setDaysLimit] = useState(7);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  // Handle Resume Selection
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
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
      toast.error("Please upload your resume PDF.");
      return;
    }

    setGenerating(true);

    try {
      // 1. Calculate file hash locally in browser
      const arrayBuffer = await resumeFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const resumeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 2. Check for duplicate on the backend
      const checkRes = await checkDuplicatePlan({
        resumeHash,
        jobDescriptionUrl: jobDescriptionUrl.trim(),
        daysLimit
      });

      if (checkRes && checkRes.exists) {
        console.log('[Home] Existing plan found. Redirecting...');
        toast.success("Existing preparation plan loaded!");
        navigate(`/interview/${checkRes.reportId}`);
        return;
      }

      // 3. Generate report if it does not exist
      const data = await generateReport({
        resumeFile,
        jobDescriptionUrl: jobDescriptionUrl.trim(),
        daysLimit,
      });

      if (!data || !data.interviewReport?._id) {
        throw new Error("Unable to generate interview report.");
      }

      toast.success("Interview strategy generated successfully!");
      navigate(`/interview/${data.interviewReport._id}`);
    } catch (error) {
      setGenerating(false);
      const errMsg = error?.response?.data?.error || error.message || "Failed to generate report. Please try again.";
      toast.error(errMsg);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <LoadingScreen
        active={generating}
        minDelay={2500}
        quotes={MOTIVATIONAL_QUOTES}
        message="Generating your custom interview strategy..."
      />
      {/* Top Header */}
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
              className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-semibold"
            >
              <LogOut size={15} />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Create Plan Section */}
      <main className="flex-grow mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-10 flex flex-col gap-6 md:gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Create Your Custom <span className="text-primary">Interview Plan</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Analyze job descriptions, upload your resume, and generate dynamic custom preparation roadmaps.
          </p>
        </div>

        <div className="flex-grow flex flex-col justify-center">
          <CreatePlan
            jobDescriptionUrl={jobDescriptionUrl}
            setJobDescriptionUrl={setJobDescriptionUrl}
            fileName={fileName}
            setFileName={setFileName}
            resumeInputRef={resumeInputRef}
            handleFileChange={handleFileChange}
            handleGenerateReport={handleGenerateReport}
            loading={loading || generating}
            handleClearFile={handleClearFile}
            daysLimit={daysLimit}
            setDaysLimit={setDaysLimit}
            hasFile={!!resumeFile}
          />
        </div>
      </main>
    </div>
  );
};

export default Home;
