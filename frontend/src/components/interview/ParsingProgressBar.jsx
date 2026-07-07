import { useState, useEffect } from "react";
import { Progress } from "../ui/progress";

export function ParsingProgressBar({ isParsing, hasValue, error, label, successLabel, defaultLabel }) {
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let interval;
    if (isParsing) {
      setProgress(0);
      setShowSuccess(false);

      const duration = 5000; // 5 seconds minimum delay
      const stepTime = 100; // update every 100ms
      const totalSteps = duration / stepTime;
      const targetProgress = 95;
      const increment = targetProgress / totalSteps;

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < targetProgress) {
            return prev + increment;
          }
          return prev;
        });
      }, stepTime);
    } else {
      if (hasValue && !error) {
        // Sweep to 100%
        setProgress(100);
        const timer = setTimeout(() => {
          setShowSuccess(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setProgress(0);
        setShowSuccess(false);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isParsing, hasValue, error]);

  if (isParsing || (hasValue && !showSuccess)) {
    return (
      <div className="w-full flex flex-col gap-1.5 py-1">
        <div className="flex justify-between text-xs text-primary font-medium">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full h-1 bg-muted rounded-full" />
      </div>
    );
  }

  if (showSuccess || (hasValue && !isParsing)) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-medium">
        <div className="size-4 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-xs">✓</div>
        <span>{successLabel || "Success!"}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive font-medium">
        <div className="size-4 flex items-center justify-center rounded-full bg-red-100 text-destructive text-xs">✗</div>
        <span className="truncate max-w-[280px]" title={error}>{error}</span>
      </div>
    );
  }

  return (
    <span className="text-muted-foreground text-xs">{defaultLabel}</span>
  );
}
