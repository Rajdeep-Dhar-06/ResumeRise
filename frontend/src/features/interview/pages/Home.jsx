import React, { useState, useRef } from "react";
import LoadingScreen from "../../../components/LoadingScreen.jsx";
import { useInterview } from "../hooks/useInterview.jsx";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Briefcase, User, Upload, FileText, Info, Sparkles, Loader2, CheckCircle2 } from "lucide-react";

// Home dashboard screen.
const Home = () => {
  const { loading, generateReport, reports, scrapeJobDescriptionUrl } = useInterview();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const resumeInputRef = useRef();

  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("");
  const [scrapedSkills, setScrapedSkills] = useState(null);
  const [scrapedRequirements, setScrapedRequirements] = useState(null);
  const [scraping, setScraping] = useState(false);

  const navigate = useNavigate();

  // Scrapes Job Description from URL
  const handleScrapeUrl = async (urlToScrape) => {
    const url = urlToScrape || jobDescriptionUrl;
    if (!url || !url.trim()) {
      toast.error("Please enter a valid job description URL first.");
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }

    setScraping(true);
    const toastId = toast.loading("Scraping and analyzing job description webpage in background...");
    const minDelay = new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const [response] = await Promise.all([scrapeJobDescriptionUrl(url), minDelay]);
      if (response && response.data) {
        const { title, jobDescription: cleanedJd, skills, requirements } = response.data;
        setJobDescription(cleanedJd || "");
        setScrapedSkills(skills || []);
        setScrapedRequirements(requirements || []);
        toast.success(`Successfully scraped job description: "${title || 'Job'}"`, { id: toastId });
      } else {
        throw new Error("Invalid response format from scraping service.");
      }
    } catch (error) {
      await minDelay;
      console.error("Scraping error:", error);
      toast.error(
        error?.response?.data?.error ||
        error.message ||
        "Unable to scrape the webpage. Please copy and paste the text manually.",
        { id: toastId }
      );
    } finally {
      setScraping(false);
    }
  };

  // Handle Resume Selection
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    toast.success(`Resume selected: ${file.name}`);
  };

  // Trigger Report Generation
  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current.files[0];

    if (!resumeFile) {
      toast.error("Please upload a resume file before generating your interview plan.");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please provide the target job description details first.");
      return;
    }

    const toastId = toast.loading("Uploading resume and generating interview plan...");

    try {
      const data = await generateReport({
        jobDescription,
        selfDescription,
        resumeFile,
        jobDescriptionUrl,
        scrapedSkills,
        scrapedRequirements,
      });

      if (!data || !data.interviewReport?._id) {
        throw new Error("Unable to upload resume and generate report.");
      }

      toast.success("Resume uploaded and report generated successfully.", { id: toastId });

      setTimeout(() => {
        navigate(`/interview/${data.interviewReport._id}`);
      }, 700);
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
        error.message ||
        "Resume upload failed. Please try again.",
        { id: toastId }
      );
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading your interview plan…" />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 flex flex-col items-center p-6 md:p-12 gap-12">
      
      {/* Page Header */}
      <header className="text-center mt-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight whitespace-nowrap">
          Create Your Custom{" "}
          <span className="text-indigo-400">Interview Plan</span>
        </h1>
      </header>

      {/* Main Input Card */}
      <div className="w-full max-w-7xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row">
          
          {/* Left Panel: Target Job Details */}
          <div className="flex-1 flex flex-col gap-6 p-8 lg:p-10 relative">
            <div className="flex items-center gap-3">
              <span className="flex items-center text-indigo-400">
                <Briefcase size={20} />
              </span>
              <h2 className="text-lg font-semibold text-slate-200 flex-1">
                Target Job Details
              </h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20">
                Required
              </span>
            </div>

            {/* URL Input */}
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={jobDescriptionUrl}
                    onChange={(e) => setJobDescriptionUrl(e.target.value)}
                    onBlur={() => handleScrapeUrl()}
                    onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-base text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="Paste job posting URL (e.g. LinkedIn, Indeed)..."
                  />
                  {scraping && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleScrapeUrl()}
                  disabled={scraping}
                  className="px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  {scraping ? "Fetching..." : "Fetch"}
                </button>
              </div>

              {/* Job Description Status Indicator */}
              {scraping ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl">
                  <Loader2 className="animate-spin h-5 w-5 text-indigo-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-indigo-300">Extracting job details...</p>
                </div>
              ) : jobDescription ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                  <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-emerald-300">Job description fetched successfully</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <Info size={18} className="text-slate-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-slate-500">Paste a job URL above and click Fetch to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Dividers */}
          <div className="hidden md:block w-px bg-slate-800 flex-shrink-0" />
          <div className="block md:hidden h-px bg-slate-800 mx-8" />

          {/* Right Panel: Profile & Resume */}
          <div className="flex-1 flex flex-col gap-8 p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center text-indigo-400">
                <User size={20} />
              </span>
              <h2 className="text-lg font-semibold text-slate-200">
                Your Profile
              </h2>
            </div>

            {/* Upload Resume Form */}
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 text-base font-medium text-slate-300">
                <Upload size={16} className="text-indigo-400" />
                Upload Resume PDF
              </label>
              
              <div 
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors"
                onClick={() => resumeInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={resumeInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
                <FileText size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="text-sm text-slate-400">
                  {fileName ? (
                    <strong className="text-indigo-400">{fileName}</strong>
                  ) : (
                    "Click to browse or drag & drop your PDF resume"
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF format only (Max 3MB)</p>
              </div>
            </div>

            {/* Self Description Bio Box */}
            <div className="flex flex-col gap-3">
              <label
                className="text-base font-medium text-slate-300"
                htmlFor="selfDescription"
              >
                Quick Self-Description
              </label>
              <textarea
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                id="selfDescription"
                name="selfDescription"
                className="w-full h-28 bg-slate-800 border border-slate-700 rounded-xl p-4 text-base text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed transition-colors"
                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
              />
            </div>

            {/* Info Message Box */}
            <div className="flex items-start gap-4 p-5 bg-indigo-950/40 border border-indigo-900/50 rounded-xl mt-auto">
              <span className="flex-shrink-0 text-indigo-400 mt-0.5">
                <Info size={18} />
              </span>
              <p className="text-sm text-indigo-200/80 leading-relaxed">
                Either a <strong className="text-slate-200 font-semibold">Resume</strong> or a{" "}
                <strong className="text-slate-200 font-semibold">Self Description</strong> is
                required to generate a personalized plan.
              </p>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 lg:px-10 border-t border-slate-800 gap-6 bg-slate-900/50">
          <span className="text-sm font-medium text-slate-500">
            AI-Powered Strategy Generation &bull; Approx 30s
          </span>
          <button
            onClick={handleGenerateReport}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base rounded-xl transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            disabled={loading}
          >
            <Sparkles size={18} />
            Generate My Interview Strategy
          </button>
        </div>
      </div>

      {/* Recent Reports List */}
      {reports.length > 0 && (
        <section className="w-full max-w-7xl flex flex-col gap-8 mt-12 mb-8">
          <div className="flex flex-col gap-2 mb-2">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              My Recent Interview Plans
            </h2>
            <p className="text-slate-400 text-base">
              Review and continue preparing with your previously generated strategies.
            </p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reports.slice(0, 6).map((report) => (
              <li
                key={report._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col gap-4 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all shadow-sm"
                onClick={() => navigate(`/interview/${report._id}`)}
              >
                <h3 className="text-lg font-bold text-slate-200 leading-tight">
                  {report.title || "Untitled Position"}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Generated on{" "}
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-sm font-medium text-slate-400">Match Score</span>
                  <span
                    className={`text-sm font-bold px-3 py-1.5 rounded-md ${report.matchScore >= 80
                      ? "text-emerald-400 bg-emerald-400/10"
                      : report.matchScore >= 60
                        ? "text-amber-400 bg-amber-400/10"
                        : "text-red-400 bg-red-400/10"
                      }`}
                  >
                    {report.matchScore}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Home;
