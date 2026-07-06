import React, { useState, useEffect } from "react";
import { useInterview } from "../hooks/useInterview.jsx";
import { useParams, useNavigate } from "react-router";
import LoadingScreen from "../../../components/LoadingScreen.jsx";
import { Code, MessageSquare, Compass, ChevronDown, Download, ArrowLeft } from "lucide-react";

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
];

// Question Card Component
const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
      <div
        className="flex items-start gap-4 px-6 py-4 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex-shrink-0 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2 py-1 mt-0.5">
          Q{index + 1}
        </span>
        <p className="flex-1 text-base font-medium text-slate-200 leading-relaxed">
          {item.question}
        </p>
        <span
          className={`flex-shrink-0 text-slate-500 mt-1 transition-transform ${open ? "rotate-180 text-indigo-400" : ""}`}
        >
          <ChevronDown size={20} />
        </span>
      </div>
      {open && (
        <div className="px-6 pb-6 flex flex-col gap-5 border-t border-slate-700 pt-5 bg-slate-800/50">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-md px-2.5 py-1 w-fit">
              Intention
            </span>
            <p className="text-sm text-slate-400 leading-relaxed">
              {item.intention}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1 w-fit">
              Model Answer
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">
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
  <div className="roadmap-dot flex flex-col gap-2 py-3 pl-14 relative">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
        Day {day.day}
      </span>
      <h3 className="text-base font-semibold text-slate-200">{day.focus}</h3>
    </div>
    <ul className="flex flex-col gap-1 list-none p-0 m-0">
      {day.tasks.map((task, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-400 leading-relaxed">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-500 mt-2" />
          {task}
        </li>
      ))}
    </ul>
  </div>
);

// Main Interview Component
const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const { report, getReportById, loading, getResumePdf } = useInterview();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    }
  }, [getReportById, interviewId]);

  if (loading || !report) {
    return <LoadingScreen message="Loading your interview plan…" />;
  }

  // Border score styling
  const scoreColor =
    report.matchScore >= 80
      ? "border-emerald-400"
      : report.matchScore >= 60
        ? "border-amber-400"
        : "border-red-400";

  // Text score styling
  const scoreTextColor =
    report.matchScore >= 80
      ? "text-emerald-400"
      : report.matchScore >= 60
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-200 flex items-stretch ">
      <div className="flex w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

        {/* Left Navigation Panel */}
        <nav className="w-64 flex-shrink-0 p-8 flex flex-col justify-between border-r border-slate-800">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 mb-6 text-sm font-semibold text-slate-400 hover:text-slate-100 bg-slate-800/40 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              <span>Back to Generator</span>
            </button>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
              Sections
            </p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${activeNav === item.id
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="flex items-center flex-shrink-0">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
          {/* <button
            onClick={() => {
              getResumePdf(interviewId);
            }}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            <Download size={14} />
            Download Resume
          </button> */}
        </nav>

        {/* Center Main Report Content */}
        <main className="flex-1 p-8 lg:p-10 overflow-y-auto max-h-screen pb-20">

          {activeNav === "technical" && (
            <section className="min-h-full">
              <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-200">
                  Technical Questions
                </h2>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {report.technicalQuestions.length} questions
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {report.technicalQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "behavioral" && (
            <section className="min-h-full">
              <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-200">
                  Behavioral Questions
                </h2>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {report.behavioralQuestions.length} questions
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {report.behavioralQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "roadmap" && (
            <section className="min-h-full">
              <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-200">
                  Preparation Road Map
                </h2>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {report.preparationPlan.length}-day plan
                </span>
              </div>
              <div className="roadmap-timeline flex flex-col relative">
                {report.preparationPlan.map((day) => (
                  <RoadMapDay key={day.day} day={day} />
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Right Sidebar Details */}
        <aside className="w-72 flex-shrink-0 p-8 flex flex-col gap-6 border-l border-slate-800">
          {/* Match Score Gauge */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 self-start">
              Match Score
            </p>
            <div
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${scoreColor}`}
            >
              <span className="text-2xl font-extrabold text-slate-200 leading-none">
                {report.matchScore}
              </span>
              <span className="text-xs text-slate-500">%</span>
            </div>
            <p className={`text-xs text-center ${scoreTextColor}`}>
              {report.matchScore >= 80
                ? "Strong match for this role"
                : report.matchScore >= 60
                  ? "Moderate match"
                  : "Needs improvement"}
            </p>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Skill Gaps */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Skill Gaps
            </p>
            <div className="flex flex-wrap gap-2">
              {report.skillGaps.map((gap, i) => (
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
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Interview;
