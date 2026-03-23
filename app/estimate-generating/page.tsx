'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ParapetLogo from "@/components/ParapetLogo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

interface Step {
  label: string;
  condition: "always" | "walkthrough" | "spatial";
  duration: number;
}

const STEPS: Step[] = [
  { label: "Processing video walkthrough", condition: "walkthrough", duration: 4000 },
  { label: "Analyzing LiDAR 3D scan data", condition: "spatial", duration: 4000 },
  { label: "Identifying scope of work by room", condition: "always", duration: 3500 },
  { label: "Calculating material & labor costs", condition: "always", duration: 3500 },
  { label: "Applying market pricing adjustments", condition: "always", duration: 3000 },
  { label: "Compiling your detailed estimate", condition: "always", duration: 3000 },
];

const HARD_TIMEOUT_MS = 90_000;

function EstimateGeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spatialId = searchParams.get("spatial_id");
  const walkthroughId = searchParams.get("walkthrough_id");

  const activeSteps = STEPS.filter(s =>
    s.condition === "always" ||
    (s.condition === "walkthrough" && walkthroughId) ||
    (s.condition === "spatial" && spatialId)
  );

  const totalDuration = activeSteps.reduce((s, step) => s + step.duration, 0);

  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const [errorState, setErrorState] = useState<"timeout" | "failed" | null>(null);
  const [errorDetail, setErrorDetail] = useState("");
  const startTime = useRef(Date.now());
  const frameRef = useRef<number>();
  const redirected = useRef(false);
  const triggered = useRef(false);

  // ── Trigger backend processing on mount ──
  // Spatial estimate is SYNCHRONOUS — await its response directly
  // Walkthrough analyze is ASYNC — returns 202, then poll for completion
  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    async function triggerProcessing() {
      try {
        // Fire spatial estimate (synchronous) and walkthrough analyze (async) in parallel
        const promises: Promise<{ type: string; ok: boolean; data?: Record<string, unknown>; error?: string }>[] = [];

        if (spatialId) {
          promises.push(
            fetch(`${API_URL}/v1/spatial/${spatialId}/estimate`, { method: "POST" })
              .then(async (res) => {
                if (!res.ok) {
                  const text = await res.text().catch(() => "");
                  return { type: "spatial", ok: false, error: `Spatial estimate failed (${res.status}): ${text}` };
                }
                const data = await res.json();
                return { type: "spatial", ok: true, data };
              })
              .catch((err) => ({ type: "spatial", ok: false, error: String(err) }))
          );
        }

        if (walkthroughId) {
          promises.push(
            fetch(`${API_URL}/v1/walkthrough/${walkthroughId}/analyze`, { method: "POST" })
              .then(async (res) => {
                if (!res.ok && res.status !== 409) {
                  // 409 = already analyzing/analyzed, that's fine
                  const text = await res.text().catch(() => "");
                  return { type: "walkthrough", ok: false, error: `Walkthrough analyze failed (${res.status}): ${text}` };
                }
                return { type: "walkthrough", ok: true };
              })
              .catch((err) => ({ type: "walkthrough", ok: false, error: String(err) }))
          );
        }

        const results = await Promise.all(promises);

        // Check for spatial success (synchronous — we have the result already)
        const spatialResult = results.find(r => r.type === "spatial");
        const walkthroughResult = results.find(r => r.type === "walkthrough");

        if (spatialResult && !spatialResult.ok) {
          // Spatial failed but walkthrough might still work
          if (!walkthroughId) {
            setErrorState("failed");
            setErrorDetail(spatialResult.error || "Estimate generation failed");
            return;
          }
        }

        if (walkthroughResult && !walkthroughResult.ok && !spatialId) {
          setErrorState("failed");
          setErrorDetail(walkthroughResult.error || "Analysis failed");
          return;
        }

        // If only spatial (no walkthrough), we're done — spatial is synchronous
        if (spatialId && !walkthroughId && spatialResult?.ok) {
          // Wait for animation to catch up, then redirect to estimate view
          const minWait = Math.max(0, totalDuration - (Date.now() - startTime.current));
          setTimeout(() => {
            if (!redirected.current) {
              redirected.current = true;
              router.push(`/estimate/${spatialId}`);
            }
          }, Math.min(minWait, 3000));
          return;
        }

        // If walkthrough is involved, we need to poll for it
        // (polling is handled by the separate useEffect below)
      } catch (err) {
        setErrorState("failed");
        setErrorDetail(err instanceof Error ? err.message : "Processing failed");
      }
    }

    triggerProcessing();
  }, [spatialId, walkthroughId, router, totalDuration]);

  // Animation
  useEffect(() => {
    const tick = () => {
      const dt = Date.now() - startTime.current;
      setElapsed(dt);

      let cumulative = 0;
      for (let i = 0; i < activeSteps.length; i++) {
        cumulative += activeSteps[i].duration;
        if (dt < cumulative) { setActiveStep(i); break; }
        if (i === activeSteps.length - 1) setActiveStep(activeSteps.length);
      }
      if (dt >= totalDuration) setAnimationDone(true);
      if (dt < totalDuration) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [activeSteps, totalDuration]);

  // Poll walkthrough status (only when walkthrough is involved)
  const pollWalkthrough = useCallback(async () => {
    if (!walkthroughId || redirected.current || errorState) return;

    if (Date.now() - startTime.current > HARD_TIMEOUT_MS) {
      setErrorState("timeout");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/v1/walkthrough/${walkthroughId}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === "analyzed" || data.analysis) {
        redirected.current = true;
        router.push("/dashboard");
        return;
      }
      if (data.status === "analysis_failed") {
        setErrorState("failed");
        setErrorDetail(data.error_message || "Walkthrough analysis failed");
      }
    } catch {
      // Keep polling
    }
  }, [walkthroughId, router, errorState]);

  useEffect(() => {
    if (!walkthroughId) return; // No polling needed for spatial-only
    const interval = setInterval(pollWalkthrough, 3000);
    return () => clearInterval(interval);
  }, [walkthroughId, pollWalkthrough]);

  const overallProgress = Math.min((elapsed / totalDuration) * 100, 100);
  const remainingSeconds = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));

  if (errorState === "failed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground text-center mb-2">We couldn&apos;t process your data. Please try again.</p>
        {errorDetail && <p className="text-[10px] text-muted-foreground/70 text-center mb-6 max-w-[300px]">{errorDetail}</p>}
        <button onClick={() => router.push("/capture")} className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl font-medium text-sm hover:bg-[#2A4F7A] transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (errorState === "timeout") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Taking longer than expected</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Your estimate is still processing. Please check back shortly.</p>
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl font-medium text-sm hover:bg-[#2A4F7A] transition-colors">
          Back to Dashboard
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
          {animationDone ? "Finalizing your estimate..." : "Generating Your Estimate"}
        </h1>

        <div className="w-full max-w-[280px] space-y-2.5 mb-8">
          {activeSteps.map((step, i) => {
            let status: "completed" | "active" | "pending";
            if (i < activeStep) status = "completed";
            else if (i === activeStep) status = "active";
            else status = "pending";

            return (
              <div key={step.label} className={`flex items-center gap-2.5 transition-all duration-500 ${
                status === "completed" ? "opacity-50" : status === "active" ? "opacity-100" : "opacity-30"
              }`}>
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
          <p className="text-[11px] text-muted-foreground mb-6">Estimated time remaining: ~{remainingSeconds}s</p>
        ) : (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full border-2 border-[#1E3A5F] border-t-transparent animate-spin" />
            <p className="text-[11px] text-muted-foreground">Almost there...</p>
          </div>
        )}

        <div className="w-full max-w-[300px]">
          <div className="h-2.5 rounded-full overflow-hidden transition-all duration-700" style={{
            width: `${Math.min(100, overallProgress * 1.15)}%`,
            background: animationDone
              ? "linear-gradient(90deg, #1E3A5F, #2BCBBA)"
              : `linear-gradient(90deg, #1E3A5F ${Math.max(0, overallProgress - 10)}%, #2BCBBA ${overallProgress}%, hsl(var(--muted)) ${Math.min(100, overallProgress + 5)}%)`,
          }} />
        </div>
      </div>

      <div className="px-8 pb-8 text-center">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Parapet AI is analyzing your video walkthrough, LiDAR scan, and uploaded documentation to generate a comprehensive renovation estimate.
        </p>
      </div>
    </div>
  );
}

export default function EstimateGeneratingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
      </div>
    }>
      <EstimateGeneratingContent />
    </Suspense>
  );
}
