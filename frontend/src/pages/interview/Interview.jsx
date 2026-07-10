import { useState } from "react";
import { useInterview } from "../../hooks/useInterview.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useParams, useNavigate } from "react-router";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { Code, MessageSquare, Compass, ArrowLeft, BookOpen, LogOut, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MOTIVATIONAL_QUOTES } from "../../lib/quotes.js";
import { RoadMapDay } from "../../components/interview/RoadMapDay.jsx";
import { ResourceCard } from "../../components/interview/ResourceCard.jsx";
import { EmptyTabState } from "../../components/interview/EmptyTabState.jsx";
import { QuestionsList } from "../../components/interview/QuestionsList.jsx";

// Navigation items definition
const NAV_ITEMS = [
  {
    id: "technical",
    label: "Technical Questions",
    icon: <Code size={16} />,
  },
  {
    id: "nontechnical",
    label: "Non-Technical Questions",
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

// Main Interview Component
const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const { report, loading, deleteReport } = useInterview();
  const { handleLogout } = useAuth();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingReport, setDeletingReport] = useState(false);

  const handleDelete = async () => {
    setDeletingReport(true);
    try {
      await deleteReport(interviewId);
      navigate("/");
    } catch (error) {
      console.error("Failed to delete interview report:", error);
    } finally {
      setDeletingReport(false);
      setShowDeleteConfirm(false);
    }
  };


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
            <Button
              variant="outline"
              size="default"
              onClick={() => navigate("/dashboard")}
              className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-semibold flex-shrink-0"
            >
              <ArrowLeft size={15} />
              <span>Dashboard</span>
            </Button>
            <Separator orientation="vertical" className="h-5 flex-shrink-0" />
            <h1 className="text-base font-semibold text-foreground truncate">
              {report?.reportTitle || "Interview Roadmap"}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 bg-red-950/30 border border-red-500/30 rounded-lg p-1 animate-in fade-in zoom-in-95 duration-150">
                <span className="text-xs font-medium text-red-400 px-1.5">Delete?</span>
                <Button
                  variant="default"
                  size="xs"
                  onClick={handleDelete}
                  disabled={deletingReport}
                  className="bg-red-600 hover:bg-red-700 font-semibold cursor-pointer"
                >
                  {deletingReport ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingReport}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                size="default"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2 cursor-pointer font-semibold flex-shrink-0"
              >
                <Trash2 size={15} />
                <span className="hidden sm:inline">Delete Plan</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="default"
              onClick={handleLogout}
              className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-semibold flex-shrink-0"
            >
              <LogOut size={15} />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-10 flex flex-col gap-8">
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
              {report?.preparationGaps && report.preparationGaps.length > 0 ? (
                report.preparationGaps.map((gap, i) => (
                  <span
                    key={i}
                    className={`text-xs font-medium px-3 py-1 rounded-md border ${gap.gapSeverity === "high"
                      ? "text-red-400 bg-red-500/10 border-red-500/20"
                      : gap.gapSeverity === "medium"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      }`}
                  >
                    {gap.requirementName}
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
              <QuestionsList title="Technical Questions" questions={report?.technicalQuestions} />
            )}

            {activeNav === "nontechnical" && (
              <QuestionsList title="Non-Technical Questions" questions={report?.nonTechnicalQuestions} />
            )}

            {activeNav === "roadmap" && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight">Study Roadmap</h2>
                  <Badge variant="secondary">{report?.preparationPlan?.length || 0}-day plan</Badge>
                </div>
                {report?.preparationPlan && report.preparationPlan.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {report.preparationPlan.map((day) => (
                      <RoadMapDay key={day.dayNumber || day.day} day={day} />
                    ))}
                  </div>
                ) : (
                  <EmptyTabState message="No preparation plan generated. All requirements are fully matched!" />
                )}
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
                      <ResourceCard key={i} item={item} />
                    ))}
                  </div>
                ) : (
                  <EmptyTabState message="No resources identified. All skills are fully matched!" />
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
