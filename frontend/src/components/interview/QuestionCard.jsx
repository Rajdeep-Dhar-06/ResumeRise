import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-muted-foreground/30 transition-colors">
      <div
        className="flex items-start gap-4 px-6 py-4 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-semibold mt-0.5">
          {index + 1}
        </span>
        <p className="flex-grow text-base font-medium text-foreground leading-snug">
          {item.questionText}
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
              {item.interviewerIntent}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1 w-fit">
              Model Answer
            </span>
            <p className="text-sm text-foreground leading-relaxed">
              {item.idealAnswer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
