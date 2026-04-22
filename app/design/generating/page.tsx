'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, CheckCircle2, Eye, ImageIcon, Link2, Tag, MessageSquare } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

const STEPS = [
  "Analyzing room data",
  "Generating concepts",
  "Selecting materials",
  "Simulating lighting",
  "Finalizing designs",
];

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [status, setStatus] = useState<"processing" | "complete">("processing");
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionData, setSessionData] = useState<any>(null);
  const startTime = useRef(Date.now());
  const redirected = useRef(false);

  const pollSession = useCallback(async () => {
    if (!sessionId || redirected.current || status === "complete") return;

    // Hard timeout at 180s
    if (Date.now() - startTime.current > 180_000) return;

    try {
      const res = await fetch(`${API_URL}/v1/design/${sessionId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setSessionData(data);

      if (data.status === "complete" || data.status === "completed") {
        setStatus("complete");
        setCurrentStep(STEPS.length);
        try { localStorage.removeItem("parapet_design_summary"); } catch {}
        return;
      }

      // Estimate step from progress or elapsed time
      if (data.progress_pct != null) {
        setCurrentStep(Math.min(Math.floor((data.progress_pct / 100) * STEPS.length), STEPS.length - 1));
      }
    } catch { /* keep polling */ }
  }, [sessionId, status]);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(pollSession, 3000);
    pollSession();
    return () => clearInterval(interval);
  }, [sessionId, pollSession]);

  // Animated step progress for visual feedback
  useEffect(() => {
    if (status === "complete") return;
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

        <h1 className="text-xl font-bold text-foreground mb-2">Creating Your Design...</h1>
        <p className="text-sm text-muted-foreground mb-1">{STEPS[currentStep] || "Generating design concepts"}...</p>
        <p className="text-xs text-muted-foreground/60 mb-8">Your designs will be ready in 1-2 minutes...</p>

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
