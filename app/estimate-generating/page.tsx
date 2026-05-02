'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

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

// Backend pipeline timeout is ~120s; pages downstream promise minutes — give
// the UI 5 minutes before flipping to the timeout state.
const HARD_TIMEOUT_MS = 300_000;
// After 2 minutes we suggest the user can close the page; the estimate will
// land in the Document Vault when it's ready.
const SLOW_THRESHOLD_MS = 120_000;

// In-flight job persistence — survives refresh and back/forward so the
// non-idempotent POST is fired exactly once per (spatialId, walkthroughId)
// pair. Cleared on successful redirect to /estimate/{id}.
const STORAGE_KEY = "parapet_estimate_job";

interface StoredJob {
  spatialId: string | null;
  walkthroughId: string | null;
  estimateId: string | null;
  startedAt: number;
}

function readJob(): StoredJob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredJob) : null;
  } catch {
    return null;
  }
}

function writeJob(job: StoredJob) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
  } catch {
    /* quota / disabled storage — tolerate silently */
  }
}

function clearJob() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function jobMatchesParams(
  job: StoredJob | null,
  spatialId: string | null,
  walkthroughId: string | null,
): boolean {
  if (!job) return false;
  return job.spatialId === spatialId && job.walkthroughId === walkthroughId;
}

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
  const [isSlow, setIsSlow] = useState(false);
  const startTime = useRef(Date.now());
  const redirected = useRef(false);
  const triggered = useRef(false);
  const estimateIdRef = useRef<string | null>(null);

  // After 2 minutes, surface a "still working" hint and a vault link so the
  // user can leave the page without losing access to their estimate.
  useEffect(() => {
    const t = setTimeout(() => setIsSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(t);
  }, []);

  // ── Trigger backend processing on mount ──
  // Spatial estimate is SYNCHRONOUS — await its response directly
  // Walkthrough analyze is ASYNC — returns 202, then poll for completion
  //
  // Refresh-safety: an in-flight job is persisted to sessionStorage so a
  // refresh or back/forward never re-fires the non-idempotent POST. If the
  // saved job already has an estimateId, we resume the redirect path.
  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    const existing = readJob();
    if (jobMatchesParams(existing, spatialId, walkthroughId) && existing) {
      // Resume — never re-POST.
      if (existing.estimateId) {
        estimateIdRef.current = existing.estimateId;
        const savedId = existing.estimateId;
        const minWait = Math.max(0, totalDuration - (Date.now() - startTime.current));
        setTimeout(() => {
          if (!redirected.current) {
            redirected.current = true;
            clearJob();
            router.push(`/estimate/${savedId}`);
          }
        }, Math.min(minWait, 3000));
      }
      // Walkthrough-only resume: the polling effect below will pick up.
      return;
    }

    // Fresh job — record the marker before firing the POST so concurrent
    // mounts (e.g. React StrictMode double-invoke) see a job and bail.
    writeJob({ spatialId, walkthroughId, estimateId: null, startedAt: Date.now() });

    async function triggerProcessing() {
      try {
        // Fire spatial estimate (synchronous) and walkthrough analyze (async) in parallel
        const promises: Promise<{ type: string; ok: boolean; data?: Record<string, unknown>; error?: string }>[] = [];

        if (spatialId) {
          promises.push(
            fetch(`${API_URL}/v1/spatial/${spatialId}/estimate${walkthroughId ? `?walkthrough_id=${walkthroughId}` : ""}`, { method: "POST", headers: getAuthHeaders() })
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
            fetch(`${API_URL}/v1/walkthrough/${walkthroughId}/analyze`, { method: "POST", headers: getAuthHeaders() })
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
            clearJob();
            setErrorState("failed");
            setErrorDetail(spatialResult.error || "Estimate generation failed");
            return;
          }
        }

        if (walkthroughResult && !walkthroughResult.ok && !spatialId) {
          clearJob();
          setErrorState("failed");
          setErrorDetail(walkthroughResult.error || "Analysis failed");
          return;
        }

        // If spatial succeeded (with or without walkthrough), we have an estimate.
        // Route to the persisted estimate by id (backend returns { id } from the POST).
        if (spatialId && spatialResult && spatialResult.ok) {
          const rawId = spatialResult.data?.id;
          const estimateId = typeof rawId === "string" && rawId.length > 0 ? rawId : null;

          if (!estimateId) {
            // Compute succeeded but persistence failed (best-effort write).
            // Don't navigate to a broken URL — surface the error and let the user retry.
            clearJob();
            setErrorState("failed");
            setErrorDetail("Estimate generated but couldn't be saved. Please try again.");
            return;
          }

          estimateIdRef.current = estimateId;
          // Persist the estimate id — if the user refreshes during the
          // animation wait, we resume the redirect instead of re-POSTing.
          writeJob({ spatialId, walkthroughId, estimateId, startedAt: Date.now() });
          const minWait = Math.max(0, totalDuration - (Date.now() - startTime.current));
          setTimeout(() => {
            if (!redirected.current) {
              redirected.current = true;
              clearJob();
              router.push(`/estimate/${estimateId}`);
            }
          }, Math.min(minWait, 3000));
          return;
        }

        // Walkthrough-only (no spatial): poll for walkthrough completion
        // (polling is handled by the separate useEffect below)
      } catch (err) {
        clearJob();
        setErrorState("failed");
        setErrorDetail(err instanceof Error ? err.message : "Processing failed");
      }
    }

    triggerProcessing();
  }, [spatialId, walkthroughId, router, totalDuration]);

  // Animation — 500ms interval is sufficient for text labels and progress bars;
  // rAF at 60fps caused excessive re-renders during multi-minute waits.
  useEffect(() => {
    const timer = setInterval(() => {
      const dt = Date.now() - startTime.current;
      setElapsed(prev => (Math.abs(dt - prev) > 100 ? dt : prev));

      let nextStep = activeSteps.length;
      let cumulative = 0;
      for (let i = 0; i < activeSteps.length; i++) {
        cumulative += activeSteps[i].duration;
        if (dt < cumulative) { nextStep = i; break; }
      }
      setActiveStep(nextStep);

      if (dt >= totalDuration) {
        setAnimationDone(true);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [activeSteps, totalDuration]);

  // Poll walkthrough status (only when walkthrough is involved)
  const pollWalkthrough = useCallback(async () => {
    if (!walkthroughId || redirected.current || errorState) return;

    if (Date.now() - startTime.current > HARD_TIMEOUT_MS) {
      setErrorState("timeout");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/v1/walkthrough/${walkthroughId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === "analyzed" || data.analysis) {
        redirected.current = true;
        clearJob();
        // Prefer (1) an estimate id captured from a spatial POST in this
        // session, (2) an estimate id surfaced by the analysis response, then
        // (3) the walkthrough detail page — a much better fallback than the
        // bare /dashboard the user was previously dropped onto.
        const analysisEstId =
          (typeof data.estimate_id === "string" && data.estimate_id) ||
          (typeof data.analysis?.estimate_id === "string" && data.analysis.estimate_id) ||
          null;
        const estId = estimateIdRef.current || analysisEstId;
        router.push(estId ? `/estimate/${estId}` : `/walkthrough/${walkthroughId}`);
        return;
      }
      if (data.status === "analysis_failed") {
        clearJob();
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
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-[320px]">
          Your estimate is still processing. It will appear in your Document Vault when it&apos;s ready.
        </p>
        <Link href="/documents" className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl font-medium text-sm hover:bg-[#2A4F7A] transition-colors">
          Open Document Vault
        </Link>
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

        <h1 className="text-lg font-bold text-foreground text-center mb-3">
          {animationDone ? "Finalizing your estimate..." : "Creating your AI renovation estimate"}
        </h1>
        <p className="text-[12px] text-muted-foreground text-center max-w-[340px] leading-relaxed mb-6">
          Traditional renovation estimates can take up to 10 business days &mdash; Parapet analyzes your project description, spatial report, and video walkthrough to create a detailed estimate in minutes.
        </p>

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

        {animationDone ? (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full border-2 border-[#1E3A5F] border-t-transparent animate-spin" />
            <p className="text-[11px] text-muted-foreground">Almost there...</p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground mb-6">This usually takes 2&ndash;5 minutes</p>
        )}

        <div className="w-full max-w-[300px]">
          <div className="h-2.5 rounded-full overflow-hidden transition-all duration-700" style={{
            width: `${Math.min(100, overallProgress * 1.15)}%`,
            background: animationDone
              ? "linear-gradient(90deg, #1E3A5F, #2BCBBA)"
              : `linear-gradient(90deg, #1E3A5F ${Math.max(0, overallProgress - 10)}%, #2BCBBA ${overallProgress}%, hsl(var(--muted)) ${Math.min(100, overallProgress + 5)}%)`,
          }} />
        </div>

        {isSlow && (
          <div className="mt-6 max-w-[320px] rounded-xl border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-foreground mb-1">
              Taking longer than expected
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              You can safely close this page &mdash; your estimate will appear in your Document Vault when it&apos;s ready.
            </p>
          </div>
        )}
      </div>

      <div className="px-8 pb-8">
        <div className="flex flex-col gap-3 max-w-[340px] mx-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Return Home
          </button>
          <button
            onClick={() => router.push("/documents")}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Document Vault
          </button>
          <p className="text-sm text-gray-500 text-center">
            Your estimate will continue generating in the background. We&apos;ll notify you when it&apos;s ready.
          </p>
        </div>
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
