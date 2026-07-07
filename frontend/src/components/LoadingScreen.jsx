import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const LoadingScreen = ({
  active = false,
  message = "Analyzing job posting and resume...",
  quotes = [],
  minDelay = 0
}) => {
  const [visible, setVisible] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(0);

  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Sync internal visibility with active prop and minDelay
  useEffect(() => {
    if (active) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setVisible(true);
      setProgress(0);
      setQuoteIndex(0);
      startTimeRef.current = Date.now();
    } else {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(minDelay - elapsed, 0);

        timerRef.current = setTimeout(() => {
          setVisible(false);
          startTimeRef.current = null;
        }, remaining);
      } else {
        setVisible(false);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [active, minDelay]);

  // Quote rotation effect
  useEffect(() => {
    if (!visible || !quotes || quotes.length === 0) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        setFade(true);
      }, 300);
    }, 4500);

    return () => clearInterval(interval);
  }, [visible, quotes]);

  // Simulated progress bar effect
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        const diff = Math.random() * 6 + 2;
        return Math.min(prev + diff, 98);
      });
    }, 400);

    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm select-none">
      <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <CardContent className="flex flex-col items-center justify-center gap-6 p-8">
          {/* Animated pulsing Sparkles badge */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="size-6 text-primary animate-pulse" />
          </div>

          <div className="flex flex-col items-center gap-4 w-full text-center">
            {/* Loading status message */}
            <div className="flex flex-col gap-1 w-full">
              <span className="text-xs font-bold tracking-wider uppercase text-primary/80">
                {message}
              </span>

              {/* Simulated Progress bar from shadcn */}
              <div className="mt-2 w-full">
                <Progress value={progress} className="h-1.5 w-full" />
              </div>
            </div>

            {/* Encapsulated Motivational Quote */}
            {quotes && quotes.length > 0 && (
              <p
                className={`text-sm text-muted-foreground font-medium min-h-[3rem] px-2 flex items-center justify-center transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"
                  }`}
              >
                "{quotes[quoteIndex]}"
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingScreen;
