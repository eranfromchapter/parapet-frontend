'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, CheckCircle2, Eye, ImageIcon, Link2, Tag, MessageSquare, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

// Page copy promises 10–15 minutes; give the timeout enough headroom so it
// only fires for genuinely stuck jobs.
const HARD_TIMEOUT_MS = 900_000;

const STEPS = [
  "Analyzing room data",
  "Generating concepts",
  "Selecting materials",
  "Simulating lighting",
  "Finalizing designs",
];

type DesignStatus = "processing" | "complete" | "timeout" | "failed";

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [status, setStatus] = useState<DesignStatus>("processing");
  const [errorDetail, setErrorDetail] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionData, setSessionData] = useState<any>(null);
  const startTime = useRef(Date.now());
  const redirected = useRef(false);
  // statusRef mirrors the status state so pollSession can read it without
  // being a dependency — avoids recreating the callback (and restarting the
  // interval) every time status changes.
  const statusRef = useRef<DesignStatus>("processing");
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollSession = useCallback(async () => {
    if (!sessionId || redirected.current || statusRef.current !== "processing") return;

    if (Date.now() - startTime.current > HARD_TIMEOUT_MS) {
      statusRef.current = "timeout";
      setStatus("timeout");
      stopPolling();
      return;
    }

    try {
      const res = await fetch(`${API_URL}/v1/design/${sessionId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setSessionData(data);

      if (data.status === "complete" || data.status === "completed") {
        statusRef.current = "complete";
        setStatus("complete");
        setCurrentStep(STEPS.length);
        stopPolling();
        try { localStorage.removeItem("parapet_design_summary"); } catch {}
        return;
      }

      if (data.status === "failed" || data.status === "error") {
        statusRef.current = "failed";
        setStatus("failed");
        setErrorDetail(typeof data.error === "string" ? data.error : "");
        stopPolling();
        return;
      }

      // Estimate step from progress or elapsed time
      if (data.progress_pct != null) {
        setCurrentStep(Math.min(Math.floor((data.progress_pct / 100) * STEPS.length), STEPS.length - 1));
      }
    } catch { /* keep polling */ }
  }, [sessionId, stopPolling]);

  useEffect(() => {
    if (!sessionId) return;
    pollIntervalRef.current = setInterval(pollSession, 3000);
    pollSession();
    return () => {
      stopPolling();
    };
  }, [sessionId, pollSession, stopPolling]);

  // Resume polling after a timeout — resets the wall clock and restarts the
  // interval so a slow-but-still-running design pipeline isn't permanently
  // abandoned by the UI.
  const handleCheckAgain = useCallback(() => {
    startTime.current = Date.now();
    statusRef.current = "processing";
    setStatus("processing");
    setErrorDetail("");
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(pollSession, 3000);
    pollSession();
  }, [pollSession]);

  // Animated step progress for visual feedback — pause once we've left the
  // active processing state so the dots don't keep advancing on the
  // timeout / failed / complete screens.
  useEffect(() => {
    if (status !== "processing") return;
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 12000);
    return () => clearInterval(timer);
  }, [status]);

  // Auto-navigate to results as soon as generation completes (brief delay so the
  // completion checkmark is perceptible, but no manual tap required).
  useEffect(() => {
    if (status !== "complete" || !sessionId || redirected.current) return;
    const t = setTimeout(() => {
      if (redirected.current) return;
      redirected.current = true;
      router.push(`/design/results?session=${sessionId}`);
    }, 1200);
    return () => clearTimeout(t);
  }, [status, sessionId, router]);

  // Read locally-stored summary from creation form, fall back to API data
  const [localSummary] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("parapet_design_summary") || "null");
    } catch { return null; }
  });
  const summaryItems = sessionData?.style_preferences;

  if (status === "timeout") {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Generating Design" backPath="/design" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-full bg-[#F59E0B]/15 flex items-center justify-center mb-6">
            <AlertTriangle size={36} className="text-[#F59E0B]" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2 text-center">
            This is taking longer than usual
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-[320px] mb-8">
            Your design may still be processing. Try checking again in a moment, or come back later from your Design Studio.
          </p>
          <button
            onClick={handleCheckAgain}
            className="w-full bg-[#1E3A5F] text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#2A4F7A] transition-colors"
          >
            Check again
          </button>
          <Link
            href="/design"
            className="mt-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Design Studio
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Generating Design" backPath="/design" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <AlertTriangle size={36} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2 text-center">
            Design generation failed
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-[320px] mb-2">
            We couldn&apos;t finish generating your design. Please try again.
          </p>
          {errorDetail && (
            <p className="text-[11px] text-muted-foreground/70 text-center max-w-[300px] mb-6">
              {errorDetail}
            </p>
          )}
          <Link
            href="/design/new"
            className="w-full bg-[#1E3A5F] text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#2A4F7A] transition-colors"
          >
            Try again
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Design Complete" backPath="/design" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-full bg-[#10B981] flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Design Complete</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Your AI design concepts are ready</p>
          <button
            onClick={() => {
              redirected.current = true;
              router.push(`/design/results?session=${sessionId}`);
            }}
            className="w-full bg-[#1E3A5F] text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20"
          >
            <Eye size={16} /> View Your Designs
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader title="Generating Design" backPath="/design" />

      {/* Progress bar */}
      <div className="h-1 bg-muted overflow-hidden">
        <div
          className="h-full bg-[#1E3A5F] transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(((currentStep + 1) / STEPS.length) * 100, 95)}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated icon */}
        <div className="mb-8">
          <Sparkles size={48} className="text-[#1E3A5F] animate-pulse" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">Creating your design concept</h1>
        <p className="text-base text-muted-foreground text-center max-w-[320px] mb-3">
          This may take several minutes. You can leave this page safely &mdash; we&apos;ll notify you when the design is ready and save it in your Document Vault.
        </p>
        <p className="text-sm text-muted-foreground mb-8">{STEPS[currentStep] || "Generating design concepts"}...</p>

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i <= currentStep ? "bg-[#1E3A5F]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-10">Step {Math.min(currentStep + 1, STEPS.length)} of {STEPS.length}</p>

        {/* Summary card */}
        <div className="w-full bg-white rounded-xl border border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon size={14} /> Reference Images
            </div>
            <span className="text-xs font-medium text-foreground">{localSummary?.reference_images ?? summaryItems?.reference_image_count ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 size={14} /> Inspiration Links
            </div>
            <span className="text-xs font-medium text-foreground">
              {(localSummary?.inspiration_links || (summaryItems?.inspiration_links?.length ?? 0) > 0) ? "Added" : "None"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tag size={14} /> Style Keywords
            </div>
            <span className="text-xs font-medium text-foreground">
              {localSummary?.style_keywords ?? summaryItems?.keywords?.length ?? 0} selected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare size={14} /> Custom Vision
            </div>
            <span className="text-xs font-medium text-foreground">
              {(localSummary?.vision_text || summaryItems?.vision_text) ? "Added" : "None"}
            </span>
          </div>
        </div>

        <div className="w-full mt-8 flex flex-col gap-3">
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
            Your design will continue generating in the background. We&apos;ll notify you when it&apos;s ready.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default function DesignGeneratingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <Sparkles size={48} className="text-[#1E3A5F] animate-pulse" />
      </div>
    }>
      <GeneratingContent />
    </Suspense>
  );
}
