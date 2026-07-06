import React, { useState, useEffect } from "react";
import { useInterview } from "../../hooks/useInterview.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useParams, useNavigate } from "react-router";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { Code, MessageSquare, Compass, ChevronDown, ArrowLeft, BookOpen, ExternalLink, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Navigation items definition
const NAV_ITEMS = [
  {
    id: "technical",
    label: "Technical Questions",
    icon: <Code size={16} />,
  },
  {
    id: "behavioral",
    label: "Behavioral Questions",
    icon: <MessageSquare size={16} />,
  },
  {
    id: "roadmap",
    label: "Road Map",
    icon: <Compass size={16} />,
  },
  {
    id: "resources",
    label: "Learning Resources",
    icon: <BookOpen size={16} />,
  },
];

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

// Question Card Component
const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-muted-foreground/30 transition-colors">
      <div
        className="flex items-start gap-4 px-6 py-4 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex-shrink-0 text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-1 mt-0.5">
          Q{index + 1}
        </span>
        <p className="flex-1 text-base font-medium text-foreground leading-relaxed">
          {item.question}
        </p>
        <span
          className={`flex-shrink-0 text-slate-500 mt-1 transition-transform ${open ? "rotate-180 text-primary" : ""}`}
        >
          <ChevronDown size={20} />
        </span>
      </div>
      {open && (
        <div className="px-6 pb-6 flex flex-col gap-5 border-t border-border pt-5 bg-accent/10">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-md px-2.5 py-1 w-fit">
              Intention
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.intention}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1 w-fit">
              Model Answer
            </span>
            <p className="text-sm text-foreground leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Roadmap Day Component
const RoadMapDay = ({ day }) => (
  <div className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-card">
    <div className="flex items-center gap-2.5">
      <Badge variant="default" className="px-2.5 py-0.5 rounded-full font-bold">
        Day {day.day}
      </Badge>
      <h3 className="text-base font-semibold text-foreground">{day.focus}</h3>
    </div>
    <ul className="flex flex-col gap-2 list-none p-0 m-0 pl-1">
      {day.tasks.map((task, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
          <span className="flex-1">{task}</span>
        </li>
      ))}
    </ul>
  </div>
);

// Main Interview Component
const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const { report, getReportById, loading } = useInterview();
  const { handleLogout } = useAuth();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (interviewId && report?._id !== interviewId) {
      getReportById(interviewId);
    }
  }, [getReportById, interviewId, report?._id]);

  // Border score styling
  const score = report?.matchScore || 0;
  const scoreColor =
    score >= 75
      ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400"
      : score >= 60
        ? "border-amber-500/50 bg-amber-500/5 text-amber-400"
        : "border-red-500/50 bg-red-500/5 text-red-400";

  // Text score styling
  const scoreTextColor =
    score >= 75
      ? "text-emerald-400"
      : score >= 60
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center">
      {/* Loading Overlay */}
      <LoadingScreen
        active={loading || !report}
        minDelay={1500}
        quotes={MOTIVATIONAL_QUOTES}
        message="Loading your interview plan…"
      />

      {/* Top Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground bg-accent/20 hover:bg-accent border border-border rounded-lg transition-all cursor-pointer flex-shrink-0"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </button>
            <Separator orientation="vertical" className="h-5 flex-shrink-0" />
            <h1 className="text-base font-semibold text-foreground truncate">
              {report?.title || "Interview Roadmap"}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground bg-accent/20 hover:bg-accent border border-border rounded-lg transition-all cursor-pointer flex-shrink-0"
          >
            <LogOut size={15} />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-10 flex flex-col gap-8 w-full">
        {/* Top Summary Block */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Match Score Card */}
          <Card className="flex flex-col items-center justify-center p-6 text-center">
            <span className="text-sm font-medium text-muted-foreground mb-4">Match Score</span>
            <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${scoreColor} mb-2`}>
              <span className="text-2xl font-bold leading-none">{score}</span>
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <p className={`text-xs font-semibold ${scoreTextColor}`}>
              {score >= 75 ? "Strong match for this role" : score >= 60 ? "Moderate match" : "Needs improvement"}
            </p>
          </Card>

          {/* Skill Gaps Card */}
          <Card className="md:col-span-2 p-6 flex flex-col justify-start gap-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Skill Gaps</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Identified missing or weak areas in your profile.</p>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-28 pr-2">
              {report?.skillGaps && report.skillGaps.length > 0 ? (
                report.skillGaps.map((gap, i) => (
                  <span
                    key={i}
                    className={`text-xs font-medium px-3 py-1 rounded-md border ${gap.severity === "high"
                      ? "text-red-400 bg-red-500/10 border-red-500/20"
                      : gap.severity === "medium"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      }`}
                  >
                    {gap.skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No critical skill gaps identified! Perfect match.</span>
              )}
            </div>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col gap-6">
          <div className="flex gap-2 border-b border-border pb-px overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${activeNav === item.id
                  ? "border-primary text-foreground bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                onClick={() => setActiveNav(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Active Tab Panel Content */}
          <div className="mt-2">
            {activeNav === "technical" && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight">Technical Questions</h2>
                  <Badge variant="secondary">{report?.technicalQuestions?.length || 0} questions</Badge>
                </div>
                <div className="flex flex-col gap-3">
                  {report?.technicalQuestions?.map((q, i) => (
                    <QuestionCard key={i} item={q} index={i} />
                  ))}
                </div>
              </section>
            )}

            {activeNav === "behavioral" && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight">Behavioral Questions</h2>
                  <Badge variant="secondary">{report?.behavioralQuestions?.length || 0} questions</Badge>
                </div>
                <div className="flex flex-col gap-3">
                  {report?.behavioralQuestions?.map((q, i) => (
                    <QuestionCard key={i} item={q} index={i} />
                  ))}
                </div>
              </section>
            )}

            {activeNav === "roadmap" && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight">Study Roadmap</h2>
                  <Badge variant="secondary">{report?.preparationPlan?.length || 0}-day plan</Badge>
                </div>
                <div className="flex flex-col gap-4">
                  {report?.preparationPlan?.map((day) => (
                    <RoadMapDay key={day.day} day={day} />
                  ))}
                </div>
              </section>
            )}

            {activeNav === "resources" && (
              <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight">Recommended Learning Resources</h2>
                  <Badge variant="secondary">{report?.learningResources?.length || 0} skills</Badge>
                </div>
                {report?.learningResources && report.learningResources.length > 0 ? (
                  <div className="grid gap-6">
                    {report.learningResources.map((item, i) => (
                      <div key={i} className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-card">
                        <h3 className="text-base font-bold text-foreground capitalize">
                          {item.skill}
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2 mt-1">
                          {item.resources && item.resources.length > 0 ? (
                            item.resources.map((resource, idx) => (
                              <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col justify-between p-4 rounded-lg border border-border bg-accent/5 hover:bg-accent/15 hover:border-muted-foreground/30 transition-all cursor-pointer"
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                      {resource.title}
                                    </h4>
                                    <ExternalLink size={14} className="text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                    {resource.snippet || "No description provided."}
                                  </p>
                                </div>
                                <div className="mt-3 text-[10px] font-bold text-primary tracking-wider uppercase flex items-center gap-1">
                                  <span>View Tutorial</span>
                                </div>
                              </a>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground col-span-2">No learning resources found for this skill.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground">No resources identified. All skills are fully matched!</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Interview;
