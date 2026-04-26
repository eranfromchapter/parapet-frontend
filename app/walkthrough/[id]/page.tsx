'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ChevronDown, ChevronUp, ScanLine, Video,
  AlertTriangle, CheckCircle2, Clock, Loader2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = "/api/backend";
const TRANSCRIPT_PREVIEW_LENGTH = 300;

// All walkthrough statuses the backend can emit. Keep in sync with
// services/walkthrough/models.py and services/api/routers/walkthrough.py.
// The exhaustive Record<WalkthroughStatus, ...> below will fail to compile
// if a new status is added without a STATUS_CONFIG entry.
type WalkthroughStatus =
  | "uploaded"
  | "processing"
  | "transcribed"
  | "ready_for_analysis"
  | "transcription_failed"
  | "analyzing"
  | "analyzed"
  | "analysis_failed"
  | "confirmed";

interface WalkthroughData {
  id: string;
  status: WalkthroughStatus | string;
  spatial_id?: string;
  transcript?: string;
  analysis?: Record<string, any>;
  error_message?: string;
  estimate_id?: string;
  estimate?: { id?: string };
  created_at?: string;
  // Backend (Day 44 fix) sets `video_url` to a backend-relative streaming
  // path when the original upload is still on disk. `has_video` is a
  // convenience flag.
  video_url?: string;
  has_video?: boolean;
}

// ── Status badge ──

type StatusConfigEntry = {
  bg: string;
  text: string;
  label: string;
  icon: typeof Clock;
};

const STATUS_CONFIG: Record<WalkthroughStatus, StatusConfigEntry> = {
  uploaded:             { bg: "bg-amber-100",         text: "text-amber-800",    label: "Processing",       icon: Clock },
  processing:           { bg: "bg-amber-100",         text: "text-amber-800",    label: "Processing",       icon: Loader2 },
  transcribed:          { bg: "bg-[#2BCBBA]/15",      text: "text-[#1E8A7E]",    label: "Transcribed",      icon: CheckCircle2 },
  ready_for_analysis:   { bg: "bg-amber-100",         text: "text-amber-800",    label: "Preparing analysis…", icon: Loader2 },
  transcription_failed: { bg: "bg-red-100",           text: "text-red-700",      label: "Transcription failed", icon: AlertTriangle },
  analyzing:            { bg: "bg-amber-100",         text: "text-amber-800",    label: "Analyzing…",       icon: Loader2 },
  analyzed:             { bg: "bg-emerald-100",       text: "text-emerald-800",  label: "Analysis complete", icon: CheckCircle2 },
  analysis_failed:      { bg: "bg-red-100",           text: "text-red-700",      label: "Analysis failed",  icon: AlertTriangle },
  confirmed:            { bg: "bg-emerald-100",       text: "text-emerald-800",  label: "Confirmed",        icon: CheckCircle2 },
};

const FALLBACK_STATUS_CONFIG: StatusConfigEntry = {
  bg: "bg-gray-100",
  text: "text-gray-600",
  label: "Processing",
  icon: Loader2,
};

function StatusBadge({ status }: { status: string }) {
  const cfg = (STATUS_CONFIG as Record<string, StatusConfigEntry>)[status] ?? FALLBACK_STATUS_CONFIG;
  const Icon = cfg.icon;
  // Spinner animation for in-progress states
  const isAnimated = ["processing", "ready_for_analysis", "analyzing"].includes(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} className={isAnimated ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  );
}

// ── Skeleton rows ──

function SkeletonBlock({ h = "h-3", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} bg-muted rounded animate-pulse`} />;
}

// ── Extract transcript from various possible field locations ──

function extractTranscript(data: WalkthroughData): string | null {
  if (typeof data.transcript === "string" && data.transcript.trim()) return data.transcript.trim();
  if (typeof data.analysis?.transcript === "string" && data.analysis.transcript.trim()) return data.analysis.transcript.trim();
  if (typeof data.analysis?.text === "string" && data.analysis.text.trim()) return data.analysis.text.trim();
  return null;
}

// ── Extract non-transcript analysis fields ──

function getAnalysisEntries(analysis: Record<string, any>): [string, any][] {
  return Object.entries(analysis).filter(([k]) => !["transcript", "text"].includes(k));
}

// ── Page ──

export default function WalkthroughDetailPage() {
  const params = useParams();
  const router = useRouter();
  const walkthroughId = params.id as string;

  const [data, setData] = useState<WalkthroughData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backPath, setBackPath] = useState<string>("/capture");
  const [expanded, setExpanded] = useState(false);

  // Frames
  const [frameUrls, setFrameUrls] = useState<string[]>([]);

  // Read ?from=vault on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const from = new URLSearchParams(window.location.search).get("from");
      if (from === "vault") setBackPath("/documents");
    }
  }, []);

  // Fetch walkthrough
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`${API_URL}/v1/walkthrough/${walkthroughId}`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Failed to load walkthrough (${res.status})`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load walkthrough");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [walkthroughId]);

  // Fetch frames after main data loads (non-blocking)
  useEffect(() => {
    if (!data) return;
    const controller = new AbortController();
    const objectUrls: string[] = [];

    async function loadFrames() {
      try {
        const listRes = await fetch(`${API_URL}/v1/walkthrough/${walkthroughId}/frames`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        if (!listRes.ok) return;
        const frames: any[] = await listRes.json();
        const count = Math.min(frames.length, 6);
        if (count === 0) return;

        const urls = await Promise.all(
          Array.from({ length: count }, async (_, i) => {
            try {
              const imgRes = await fetch(
                `${API_URL}/v1/walkthrough/${walkthroughId}/frames/${i}`,
                { headers: getAuthHeaders(), signal: controller.signal }
              );
              if (!imgRes.ok) return null;
              const blob = await imgRes.blob();
              const url = URL.createObjectURL(blob);
              objectUrls.push(url);
              return url;
            } catch {
              return null;
            }
          })
        );
        setFrameUrls(urls.filter((u): u is string => u !== null));
      } catch {
        // Frames are optional — silently skip on error
      }
    }

    loadFrames();
    return () => {
      controller.abort();
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [data, walkthroughId]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background shadow-xl">
        <PageHeader title="Video Walkthrough" backPath={backPath} />
        <div className="flex-1 px-4 pt-4 pb-4 space-y-3">
          {/* Status skeleton */}
          <div className="rounded-xl border border-border/50 p-4 animate-pulse space-y-2.5">
            <SkeletonBlock h="h-2.5" w="w-20" />
            <SkeletonBlock h="h-6" w="w-32" />
          </div>
          {/* Transcript skeleton */}
          <div className="rounded-xl border border-border/50 p-4 animate-pulse space-y-2.5">
            <SkeletonBlock h="h-2.5" w="w-24" />
            <SkeletonBlock h="h-3" w="w-full" />
            <SkeletonBlock h="h-3" w="w-5/6" />
            <SkeletonBlock h="h-3" w="w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Walkthrough not available</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{error || "Walkthrough data is missing."}</p>
        <button onClick={() => router.push("/capture")} className="text-sm font-medium text-[#1E3A5F] hover:underline">
          Back to Space Capture
        </button>
      </div>
    );
  }

  const transcript = extractTranscript(data);
  const analysisEntries = data.analysis ? getAnalysisEntries(data.analysis) : [];
  const existingEstimateId = data.estimate_id || data.estimate?.id;
  const isLong = transcript && transcript.length > TRANSCRIPT_PREVIEW_LENGTH;

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background shadow-xl">
      <PageHeader title="Video Walkthrough" subtitle="AI-powered analysis" backPath={backPath} />

      <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto safe-bottom space-y-3">

        {/* ── Status ── */}
        <Card className="p-4 rounded-xl border border-border/50">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</h3>
          <StatusBadge status={data.status} />
          {data.status === "analysis_failed" && data.error_message && (
            <p className="text-[11px] text-red-600 mt-2 leading-relaxed">{data.error_message}</p>
          )}
          {data.status === "uploaded" && (
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Your video is being processed. Transcript will appear here shortly.
            </p>
          )}
          {data.created_at && (
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              Uploaded {new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </Card>

        {/* ── Original Video Player ── */}
        {data.has_video && data.video_url && (
          <Card className="p-4 rounded-xl border border-border/50">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Original Walkthrough Video</h3>
            <video
              src={`${API_URL}${data.video_url}`}
              controls
              playsInline
              preload="metadata"
              className="w-full rounded-lg bg-black"
            >
              Your browser does not support inline video playback.
            </video>
          </Card>
        )}

        {/* ── Transcript ── */}
        <Card className="p-4 rounded-xl border border-border/50">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">AI Transcript</h3>
          {transcript ? (
            <>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {isLong && !expanded ? transcript.slice(0, TRANSCRIPT_PREVIEW_LENGTH) + "…" : transcript}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#1E3A5F] hover:underline"
                >
                  {expanded ? (
                    <><ChevronUp size={13} /> Show less</>
                  ) : (
                    <><ChevronDown size={13} /> Show full transcript</>
                  )}
                </button>
              )}
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {data.status === "uploaded"
                ? "Transcript will appear here once processing completes."
                : "No transcript available for this walkthrough."}
            </p>
          )}
        </Card>

        {/* ── Analysis ── */}
        {analysisEntries.length > 0 && (
          <Card className="p-4 rounded-xl border border-border/50">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">AI Analysis</h3>
            <div className="space-y-3">
              {analysisEntries.map(([key, value]) => (
                <div key={key}>
                  <p className="text-[10px] font-semibold text-muted-foreground capitalize mb-1">
                    {key.replace(/_/g, " ")}
                  </p>
                  {typeof value === "object" && value !== null ? (
                    <pre className="text-[10px] text-foreground bg-muted/30 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-foreground leading-relaxed">{String(value)}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Frame thumbnails ── */}
        {frameUrls.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Video Frames
              <span className="ml-1.5 text-muted-foreground/60 normal-case tracking-normal">({frameUrls.length})</span>
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {frameUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Frame ${i + 1}`}
                  className="w-24 h-16 rounded-lg object-cover flex-shrink-0 border border-border/50"
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="space-y-2.5 pt-1">
          {data.spatial_id && (
            <button
              onClick={() => router.push(`/capture/${data.spatial_id}`)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/50 hover:border-[#2BCBBA]/50 hover:shadow-sm transition-all text-left"
            >
              <div className="w-9 h-9 rounded-full bg-[#2BCBBA]/10 flex items-center justify-center shrink-0">
                <ScanLine size={16} className="text-[#2BCBBA]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">View Space Scan</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">See room dimensions and LiDAR data</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground shrink-0" />
            </button>
          )}

          {existingEstimateId ? (
            <Button
              onClick={() => router.push(`/estimate/${existingEstimateId}`)}
              className="w-full h-12 font-semibold text-sm rounded-xl bg-[#2BCBBA] hover:bg-[#25B5A6] text-white shadow-lg shadow-[#2BCBBA]/20 gap-2"
            >
              View Estimate <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={() => {
                const params = new URLSearchParams({ walkthrough_id: walkthroughId });
                if (data.spatial_id) params.set("spatial_id", data.spatial_id);
                router.push(`/estimate-generating?${params.toString()}`);
              }}
              className="w-full h-12 font-semibold text-sm rounded-xl bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white shadow-lg shadow-[#1E3A5F]/20 gap-2"
            >
              Generate Estimate <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
