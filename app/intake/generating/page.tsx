'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

const ANALYSIS_STEPS = [
  { label: "Analyzing your project scope", duration: 3500 },
  { label: "Checking NYC regulations", duration: 4500 },
  { label: "Assessing project risks", duration: 3000 },
  { label: "Calculating cost estimates", duration: 4000 },
  { label: "Generating your Readiness Report", duration: 3000 },
];

const TOTAL_DURATION = ANALYSIS_STEPS.reduce((sum, s) => sum + s.duration, 0);
// Azure OpenAI + LangGraph pipeline empirically takes 2–4 min in prod (sometimes longer).
// Previous 180s timeout fired BEFORE the backend finished — that was the real "Taking longer than expected" bug.
// 8 min gives generous headroom; the user can safely close the page — the report still gets emailed.
const HARD_TIMEOUT_MS = 480_000; // 8 minutes

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

  // Gates the emergency "Your Report is Ready" button — stays true once any
  // poll confirms completion so the user has a manual fallback if automatic
  // navigation misbehaves.
  const [reportReady, setReportReady] = useState(false);

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
      // Cache-busting: `?t=` defeats URL-keyed edge caches; `cache: "no-store"`
      // tells the browser's own HTTP cache not to store/serve.
      const res = await fetch(`${API_URL}/v1/readiness-reports/${reportId}?t=${Date.now()}`, {
        headers: { ...getAuthHeaders() },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      // Broadened completion detection: accept multiple "done" status values or a populated report_json
      const status = String(data?.status ?? "").toLowerCase();
      const hasReportJson =
        data?.report_json != null &&
        typeof data.report_json === "object" &&
        Object.keys(data.report_json).length > 0;
      const isDone =
        status === "completed" || status === "complete" ||
        status === "success" || status === "done" || status === "ready" ||
        hasReportJson;

      const elapsedSeconds = Math.round(totalElapsed / 1000);
      console.log("[PARAPET] poll", {
        status,
        hasReportJson,
        elapsedSeconds,
        progressPct: data?.progress_pct,
      });

      // Gate the emergency-button visibility
      if (hasReportJson || isDone) setReportReady(true);

      // HARD FALLBACK: If we've been polling for over 30 seconds and report_json exists, navigate immediately.
      // window.location.href is ugly but bypasses the Next.js router entirely — it CANNOT be silently dropped
      // by stale closures, unmounted components, or suspense boundaries. Reliability > elegance.
      if (elapsedSeconds > 30 && hasReportJson) {
        console.log("[PARAPET] HARD FALLBACK: report_json detected, forcing navigation");
        redirected.current = true;
        window.location.href = `/readiness/${reportId}`;
        return;
      }

      if (isDone) {
        console.log("[PARAPET] completion detected → navigating to /readiness/" + reportId);
        redirected.current = true;
        try {
          router.replace(`/readiness/${reportId}`);
        } catch (e) {
          console.error("[PARAPET] router.replace failed, using window.location", e);
          window.location.href = `/readiness/${reportId}`;
        }
        return;
      }
      if (status === "failed" || status === "error") {
        console.warn("[generating] pipeline reported failure", data);
        setErrorState("failed");
        return;
      }
      // Still processing — keep polling
    } catch (err) {
      pollCount.current++;
      console.warn("[generating] poll error", pollCount.current, err);
      // Only trip the error-count timeout after a long streak of network errors,
      // and never before the hard timeout — the hard timeout is the source of truth.
      if (pollCount.current >= 60) {
        setErrorState("timeout");
      }
    }
  }, [reportId, router, errorState]);

  useEffect(() => {
    if (!reportId) return;
    // Fire immediately, then every 3s — removes the 3s wait before the first check
    pollReport();
    const interval = setInterval(pollReport, 3000);
    return () => clearInterval(interval);
  }, [reportId, pollReport]);

  const overallProgress = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
  const remainingSeconds = Math.max(0, Math.ceil((TOTAL_DURATION - elapsed) / 1000));

  // Emergency manual-navigation button. Shown whenever a poll has confirmed the
  // report is ready, so the user is never stuck even if all automatic paths fail.
  const emergencyButton = reportReady ? (
    <div className="px-6 pb-4 w-full max-w-[340px]">
      <button
        onClick={() => {
          if (reportId) window.location.href = `/readiness/${reportId}`;
        }}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30"
      >
        Your Report is Ready — Tap to View
      </button>
    </div>
  ) : null;

  // Error: pipeline failed
  if (errorState === "failed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          We couldn&apos;t generate your report. Please try again.
        </p>
        {emergencyButton}
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
        {emergencyButton}
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

      {emergencyButton && (
        <div className="flex justify-center w-full">{emergencyButton}</div>
      )}

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
