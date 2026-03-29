'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

const ANALYSIS_STEPS = [
  { label: "Analyzing market data", duration: 3500 },
  { label: "Checking regulatory requirements", duration: 4500 },
  { label: "Assessing project risks", duration: 3000 },
  { label: "Generating cost estimates", duration: 4000 },
  { label: "Compiling your report", duration: 3000 },
];

const TOTAL_DURATION = ANALYSIS_STEPS.reduce((sum, s) => sum + s.duration, 0);
const HARD_TIMEOUT_MS = 180_000; // 180 seconds

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");

  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errorState, setErrorState] = useState<"failed" | "timeout" | null>(null);
  const [animationDone, setAnimationDone] = useState(false);
  const startTime = useRef(Date.now());
  const frameRef = useRef<number>();
  const pollCount = useRef(0);
  const redirected = useRef(false);

  // Animation progress
  useEffect(() => {
    const tick = () => {
      const dt = Date.now() - startTime.current;
      setElapsed(dt);

      let cumulative = 0;
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        cumulative += ANALYSIS_STEPS[i].duration;
        if (dt < cumulative) { setActiveStep(i); break; }
        if (i === ANALYSIS_STEPS.length - 1) setActiveStep(ANALYSIS_STEPS.length);
      }

      if (dt >= TOTAL_DURATION) {
        setAnimationDone(true);
      }

      if (dt < TOTAL_DURATION) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  // Poll backend for report status — only redirect when actually completed
  const pollReport = useCallback(async () => {
    if (!reportId || redirected.current || errorState) return;

    // Hard timeout check
    const totalElapsed = Date.now() - startTime.current;
    if (totalElapsed > HARD_TIMEOUT_MS) {
      setErrorState("timeout");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";
      const res = await fetch(`${apiUrl}/v1/readiness-reports/${reportId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      if (data.status === "completed" || data.report_json != null) {
        redirected.current = true;
        router.push(`/readiness/${reportId}`);
        return;
      }
      if (data.status === "failed") {
        setErrorState("failed");
        return;
      }
      // Still processing — keep polling
    } catch {
      pollCount.current++;
      if (pollCount.current >= 30) {
        setErrorState("timeout");
      }
    }
  }, [reportId, router, errorState]);

  useEffect(() => {
    if (!reportId) return;
    const interval = setInterval(pollReport, 3000);
    return () => clearInterval(interval);
  }, [reportId, pollReport]);

  const overallProgress = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
  const remainingSeconds = Math.max(0, Math.ceil((TOTAL_DURATION - elapsed) / 1000));

  // Error: pipeline failed
  if (errorState === "failed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          We couldn&apos;t generate your report. Please try again.
        </p>
        <button
          onClick={() => router.push("/intake/review")}
          className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl font-medium text-sm hover:bg-[#2A4F7A] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Error: hard timeout
  if (errorState === "timeout") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Taking longer than expected</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Your report is taking longer than expected. Please check back in a few minutes.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl font-medium text-sm hover:bg-[#2A4F7A] transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="relative w-20 h-20 mb-8">
          <svg className="w-20 h-20 animate-[spin_2.5s_linear_infinite]" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="hsl(var(--muted))" strokeWidth="3" />
            <path d="M40 4 A36 36 0 0 1 76 40" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-[pulse_2s_ease-in-out_infinite]">
              <ParapetLogo size={28} className="text-[#1E3A5F]" />
            </div>
          </div>
        </div>

        <h1 className="text-lg font-bold text-foreground text-center mb-6">
          {animationDone ? "Finalizing your report..." : "Generating Your Report"}
        </h1>

        <div className="w-full max-w-[280px] space-y-2.5 mb-8">
          {ANALYSIS_STEPS.map((step, i) => {
            let status: "completed" | "active" | "pending";
            if (i < activeStep) status = "completed";
            else if (i === activeStep) status = "active";
            else status = "pending";

            return (
              <div
                key={step.label}
                className={`flex items-center gap-2.5 transition-all duration-500 ${
                  status === "completed" ? "opacity-50" : status === "active" ? "opacity-100" : "opacity-30"
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {status === "completed" ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="7" fill="#10B981" />
                      <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : status === "active" ? (
                    <div className="w-3 h-3 rounded-full border-2 border-[#1E3A5F] border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <span className={`text-xs leading-tight ${
                  status === "active" ? "font-semibold text-foreground" :
                  status === "completed" ? "text-muted-foreground" : "text-muted-foreground/60"
                }`}>
                  {step.label}
                  {status === "active" && <span className="inline-block ml-0.5 animate-[pulse_1s_ease-in-out_infinite]">...</span>}
                </span>
              </div>
            );
          })}
        </div>

        {!animationDone ? (
          <p className="text-[11px] text-muted-foreground mb-6">
            Estimated time remaining: ~{remainingSeconds}s
          </p>
        ) : (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full border-2 border-[#1E3A5F] border-t-transparent animate-spin" />
            <p className="text-[11px] text-muted-foreground">Almost there...</p>
          </div>
        )}

        <div className="w-full max-w-[300px]">
          <div
            className="h-2.5 rounded-full overflow-hidden transition-all duration-700"
            style={{
              width: `${Math.min(100, overallProgress * 1.15)}%`,
              background: animationDone
                ? "linear-gradient(90deg, #1E3A5F, #2BCBBA)"
                : `linear-gradient(90deg, #1E3A5F ${Math.max(0, overallProgress - 10)}%, #2BCBBA ${overallProgress}%, hsl(var(--muted)) ${Math.min(100, overallProgress + 5)}%)`,
            }}
          />
        </div>
      </div>

      <div className="px-8 pb-8 text-center">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Parapet AI is analyzing your project against local regulations,
          market data, and comparable project outcomes.
        </p>
      </div>
    </div>
  );
}

export default function IntakeGeneratingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
      </div>
    }>
      <GeneratingContent />
    </Suspense>
  );
}
