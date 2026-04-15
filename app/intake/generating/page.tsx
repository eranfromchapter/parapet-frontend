'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

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

  // TEMP — visible debug state, mirrors refs/poll results into React state so
  // the on-screen panel re-renders when polls fire. Remove once root-caused.
  const [pollCountState, setPollCountState] = useState(0);
  const [lastHttpStatus, setLastHttpStatus] = useState<number | null>(null);
  const [lastStatusValue, setLastStatusValue] = useState<string | null>(null);
  const [lastHasReportJson, setLastHasReportJson] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
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
      setPollCountState((c) => c + 1);
      // Same-origin proxy (see next.config.mjs rewrites). The browser sees a
      // same-origin request so CORS never applies; Vercel forwards the request
      // server-to-server to Railway. This is necessary because the backend's
      // OPTIONS preflight returns HTTP 400, which Safari strictly rejects with
      // "Load failed". Simple cross-origin fetch works in Chrome but not Safari.
      // Cache-busting:
      //   - `?t=${Date.now()}` query param defeats URL-keyed edge caches
      //   - `cache: "no-store"` tells the browser's own HTTP cache not to store
      const res = await fetch(`/api/backend/v1/readiness-reports/${reportId}?t=${Date.now()}`, {
        headers: { ...getAuthHeaders() },
        cache: "no-store",
      });
      setLastHttpStatus(res.status);
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
      // Per-poll telemetry — exactly the fields requested for debugging
      console.log("[PARAPET] poll", {
        status,
        hasReportJson,
        elapsedSeconds,
        progressPct: data?.progress_pct,
      });

      // Mirror into React state for the on-screen debug panel + emergency button gate
      setLastStatusValue(status || null);
      setLastHasReportJson(hasReportJson);
      setLastError(null);
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
      setLastError(err instanceof Error ? err.message : String(err));
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
  const elapsedSecUI = Math.round(elapsed / 1000);
  const hasTokenUI = typeof window !== "undefined" && !!localStorage.getItem("parapet_token");

  // TEMP — on-screen debug panel pinned to the bottom of the viewport.
  // Visible on mobile where there is no devtools console. Remove once root-caused.
  const debugPanel = (
    <div
      style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999 }}
      className="bg-gray-100 border-t border-gray-300 text-[10px] text-gray-800 px-3 py-2 font-mono leading-tight"
    >
      <div className="font-bold mb-0.5">PARAPET DEBUG</div>
      <div>poll #{pollCountState} · elapsed {elapsedSecUI}s · id {reportId ?? "—"}</div>
      <div>
        HTTP {lastHttpStatus ?? "—"} · status:{" "}
        <span className="font-bold">{lastStatusValue ?? "—"}</span> · report_json:{" "}
        <span className={lastHasReportJson ? "text-emerald-700 font-bold" : ""}>
          {lastHasReportJson ? "YES" : "no"}
        </span>{" "}
        · token {hasTokenUI ? "yes" : "MISSING"}
      </div>
      {lastError && <div className="text-red-600 break-all">err: {lastError}</div>}
    </div>
  );

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
      <>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8 pb-24">
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
        {debugPanel}
      </>
    );
  }

  // Error: hard timeout
  if (errorState === "timeout") {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8 pb-24">
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
        {debugPanel}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24">
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
      {debugPanel}
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
