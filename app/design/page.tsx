'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import ParapetLogo from "@/components/ParapetLogo";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

interface DesignSession {
  session_id: string;
  project_id: string;
  status: string;
  room_type: string;
  style_keywords: string[];
  created_at: string;
  concept_name?: string;
  budget_range?: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function formatBudget(range: string | undefined): string {
  if (!range) return "";
  return range;
}

export default function DesignHubPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DesignSession[]>([]);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions(projectId: string): Promise<{ list: DesignSession[]; max?: number } | null> {
      try {
        const res = await fetch(`${API_URL}/v1/design/sessions/${projectId}`, {
          headers: getAuthHeaders(),
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Failed to load designs (${res.status})`);
        const data = await res.json();
        const list: DesignSession[] = data.sessions ?? data.items ?? (Array.isArray(data) ? data : []);
        return { list, max: data.max_allowed };
      } catch (err) {
        throw err;
      }
    }

    async function loadSessions() {
      const spatialId = (() => { try { return localStorage.getItem("parapet_spatial_id"); } catch { return null; } })();
      try {
        // Try spatial ID first, then "default" as fallback
        let result: { list: DesignSession[]; max?: number } | null = null;
        if (spatialId) {
          result = await fetchSessions(spatialId);
        }
        if (!result || result.list.length === 0) {
          const fallback = await fetchSessions("default");
          if (fallback && fallback.list.length > 0) result = fallback;
        }
        if (result) {
          setSessions(result.list);
          if (result.max != null) setMaxAllowed(result.max);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load designs");
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const count = sessions.length;
  const limitReached = count >= maxAllowed;

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading designs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Design Studio" backPath="/dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
          <h1 className="text-lg font-bold text-foreground mb-2">Could not load designs</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl text-sm font-medium hover:bg-[#2A4F7A]"
          >
            Retry
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Empty state ──

  if (count === 0) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Design Studio" backPath="/dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Sparkles size={48} className="text-[#1E3A5F]/30 mb-4" />
          <h1 className="text-lg font-bold text-foreground mb-2">No Designs Yet</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Create your first AI-powered design concept
          </p>
          <button
            onClick={() => router.push("/design/new")}
            className="w-full max-w-xs bg-[#1E3A5F] text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#2A4F7A] transition-colors"
          >
            <Sparkles size={16} /> Create Your First Design
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Sessions list ──

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader title="Design Studio" backPath="/dashboard" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">

        {/* Section header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">My Designs</h2>
          <span className="text-[11px] font-semibold text-muted-foreground bg-[#F0F4F8] px-2.5 py-1 rounded-full">
            {count} of {maxAllowed}
          </span>
        </div>

        {/* Design cards */}
        <div className="space-y-3">
          {sessions.map((s) => {
            const isComplete = s.status === "complete" || s.status === "completed";
            const isProcessing = s.status === "processing" || s.status === "generating";
            const keywords = s.style_keywords ?? [];
            const shownKeywords = keywords.slice(0, 3);
            const moreCount = keywords.length - 3;

            return (
              <Link
                key={s.session_id}
                href={isComplete ? `/design/results?session=${s.session_id}` : `/design/generating?session=${s.session_id}`}
              >
                <div className="bg-white rounded-xl border border-border/50 p-4 hover:border-[#1E3A5F]/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{(s.room_type || "Room").replace(/_/g, " ")}</p>
                      {isComplete && s.concept_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.concept_name}
                          {s.budget_range ? ` \u00B7 ${formatBudget(s.budget_range)}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[10px] font-semibold text-[#10B981]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          Complete
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[10px] font-semibold text-[#F59E0B]">
                          <Loader2 size={10} className="animate-spin" />
                          Processing
                        </span>
                      )}
                      {!isComplete && !isProcessing && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
                          {s.status}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </div>

                  {/* Keywords */}
                  {shownKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {shownKeywords.map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded-full bg-[#F0F4F8] text-[10px] font-medium text-muted-foreground">
                          {kw}
                        </span>
                      ))}
                      {moreCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F0F4F8] text-[10px] font-medium text-muted-foreground">
                          +{moreCount} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  {s.created_at && (
                    <p className="text-[10px] text-muted-foreground/70">{formatDate(s.created_at)}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Create new CTA */}
        {limitReached ? (
          <div>
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Free Tier Limit Reached ({count}/{maxAllowed})
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Upgrade to create unlimited designs
            </p>
          </div>
        ) : (
          <button
            onClick={() => router.push("/design/new")}
            className="w-full bg-[#1E3A5F] text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#2A4F7A] transition-colors"
          >
            <Sparkles size={16} /> Create New Design
          </button>
        )}

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}
