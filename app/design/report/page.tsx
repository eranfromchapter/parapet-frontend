'use client';

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Monitor, Lightbulb, Tag, Link2, Diamond, Sun, DollarSign,
  Wrench, Sparkles, Star, Shield, ChevronLeft,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const conceptIndex = searchParams.get("concept") || "0";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const fetchReport = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_URL}/v1/design/${sessionId}/concept/${conceptIndex}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setReport(await res.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [sessionId, conceptIndex]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <Sparkles size={48} className="text-[#1E3A5F] animate-pulse" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title="Design Report" backPath={`/design/results?session=${sessionId}`} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">Report not available.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const room = report.room_analysis ?? {};
  const vision = report.vision_text ?? report.your_vision ?? "";
  const keywords: string[] = report.style_keywords ?? [];
  const inspirationLinks: string[] = report.inspiration_links ?? [];
  const materials: any[] = report.material_recommendations ?? [];
  const lighting = report.lighting_simulation ?? {};
  const budget = report.total_budget_estimate ?? report.budget_estimate ?? {};
  const maintenance: any[] = report.maintenance_advisory ?? [];
  const whyDesign = report.why_this_design ?? "";

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader title="Design Report" subtitle="Your Design Journey with PARAPET" backPath={`/design/results?session=${sessionId}`} />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-5">

        {/* Room Analysis */}
        <section className="bg-white rounded-xl border border-border/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Monitor size={16} className="text-[#1E3A5F]" />
            <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Room Analysis</h3>
          </div>
          <div className="space-y-2">
            {[
              ["Room Type", room.room_type],
              ["Dimensions", room.dimensions],
              ["Floor Area", room.floor_area_sqft ? `${room.floor_area_sqft} sq ft` : null],
              ["Features", room.features],
            ].map(([label, value]) => value ? (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium text-foreground">{value}</span>
              </div>
            ) : null)}
          </div>
        </section>

        {/* Your Vision */}
        {vision && (
          <section className="bg-white rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Your Vision</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{vision}</p>
          </section>
        )}

        {/* Style Keywords */}
        {keywords.length > 0 && (
          <section className="bg-white rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Style Keywords</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw: string) => (
                <span key={kw} className="px-3 py-1 rounded-full bg-[#1E3A5F] text-white text-xs font-medium">{kw}</span>
              ))}
            </div>
          </section>
        )}

        {/* Your Inspiration */}
        {inspirationLinks.length > 0 && (
          <section className="bg-white rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Your Inspiration</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{inspirationLinks.length} inspiration link{inspirationLinks.length !== 1 ? "s" : ""}</p>
            <div className="space-y-1.5">
              {inspirationLinks.map((link: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#1E3A5F]">
                  <Link2 size={12} className="shrink-0" />
                  <span className="truncate">{link}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Material Recommendations */}
        {materials.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Diamond size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Material Recommendations</h3>
            </div>
            <div className="space-y-3">
              {materials.map((mat: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground">{mat.category || mat.name}</p>
                    {(mat.price_range || mat.cost_range) && (
                      <p className="text-sm font-semibold text-foreground">{mat.price_range || mat.cost_range}</p>
                    )}
                  </div>
                  {mat.description && (
                    <p className="text-xs text-muted-foreground mb-2">{mat.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {mat.durability && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                        <Shield size={10} /> Durability: {mat.durability}
                      </span>
                    )}
                    {mat.maintenance && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        <Wrench size={10} /> Maintenance: {typeof mat.maintenance === "string" ? mat.maintenance : mat.maintenance.level || mat.maintenance}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lighting Simulation */}
        {(lighting.morning || lighting.afternoon || lighting.evening) && (
          <section className="bg-white rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Lighting Simulation</h3>
            </div>
            <div className="space-y-3">
              {lighting.morning && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">Morning</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{lighting.morning}</p>
                </div>
              )}
              {lighting.afternoon && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">Afternoon</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{lighting.afternoon}</p>
                </div>
              )}
              {lighting.evening && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">Evening</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{lighting.evening}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Total Budget Estimate */}
        {(budget.range || budget.min != null || budget.total) && (
          <section>
            <div className="bg-white rounded-xl border border-border/60 p-4 border-l-4 border-l-[#F59E0B]">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-[#1E3A5F]" />
                <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Total Budget Estimate</h3>
              </div>
              <p className="text-xl font-bold text-[#2BCBBA]">
                {typeof budget === "string"
                  ? budget
                  : budget.range
                    ? budget.range
                    : budget.min != null
                      ? `$${budget.min.toLocaleString()} \u2013 $${budget.max.toLocaleString()}`
                      : `$${(budget.total ?? 0).toLocaleString()}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on your room dimensions, material selections, and current market rates in your area. Labor and installation costs included.
              </p>
            </div>
          </section>
        )}

        {/* Maintenance Advisory */}
        {maintenance.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Maintenance Advisory</h3>
            </div>
            <div className="space-y-2">
              {maintenance.map((item: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-border/60 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground">{item.name || item.item}</p>
                    {item.frequency && (
                      <span className="text-[10px] font-medium bg-[#F0F4F8] text-muted-foreground px-2.5 py-0.5 rounded-full">{item.frequency}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Why This Design */}
        {whyDesign && (
          <section className="bg-white rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Why This Design?</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{whyDesign}</p>
          </section>
        )}

        {/* Rate Your Experience */}
        <section className="bg-white rounded-xl border border-border/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-[#1E3A5F]" />
            <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Rate Your Experience</h3>
          </div>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star
                  size={28}
                  className={n <= rating ? "text-[#F59E0B] fill-[#F59E0B]" : "text-gray-200"}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-2">Share your thoughts (optional)</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us about your experience..."
            className="w-full h-20 rounded-xl border border-border/60 p-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] mb-3"
          />
          <button className="w-full bg-[#1E3A5F] text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
            <Sparkles size={14} /> Submit Feedback
          </button>
        </section>

        {/* Back link */}
        <button
          onClick={() => router.push(`/design/results?session=${sessionId}`)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto py-2"
        >
          <ChevronLeft size={14} /> Back to Design Concepts
        </button>

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}

export default function DesignReportPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <Sparkles size={48} className="text-[#1E3A5F] animate-pulse" />
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
