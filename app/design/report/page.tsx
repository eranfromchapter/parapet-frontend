'use client';

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Monitor, Lightbulb, Tag, Link2, Diamond, Sun, DollarSign,
  Wrench, Sparkles, Star, Shield, ChevronLeft, Download, Loader2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const conceptIndex = searchParams.get("concept") || "0";
  const fromParam = searchParams.get("from");
  const fromVault = fromParam === "vault";
  const fromAlerts = fromParam === "alerts";
  const headerTitle = fromAlerts
    ? "Alerts"
    : fromVault
    ? "My Documents"
    : "Design Report";
  const headerSubtitle = fromAlerts
    ? "Back to Alerts"
    : fromVault
    ? "Back to Document Vault"
    : "Your Design Journey with PARAPET";
  // Default back is to the design results carousel for the same session
  // (the page that owns "this is your design"). Day 44 round-3 feedback:
  // back from Design Studio was redirecting to homepage; the cause was
  // likely a missing or stale sessionId, which used to fall through here.
  // Now we always have a results page to return to when sessionId is set.
  const backPath = fromAlerts
    ? "/notifications"
    : fromVault
    ? "/documents"
    : sessionId
    ? `/design/results?session=${sessionId}`
    : "/design";

  const { toast } = useToast();
  const [conceptData, setConceptData] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`${API_URL}/v1/design/${sessionId}/pdf?concept=${conceptIndex}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1] || "PARAPET_Design_Report.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "PDF download failed", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [conceptRes, sessionRes] = await Promise.all([
        fetch(`${API_URL}/v1/design/${sessionId}/concept/${conceptIndex}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/v1/design/${sessionId}`, { headers: getAuthHeaders() }),
      ]);
      if (conceptRes.ok) setConceptData(await conceptRes.json());
      if (sessionRes.ok) setSessionData(await sessionRes.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [sessionId, conceptIndex]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-[#FAFBFC] shadow-xl">
        <Sparkles size={48} className="text-[#1E3A5F] animate-pulse" />
      </div>
    );
  }

  if (!conceptData) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <PageHeader title={headerTitle} backPath={backPath} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">Report not available.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  // API nests report fields under conceptData.report
  const rpt = conceptData.report ?? {};
  const room = sessionData?.room_analysis ?? {};
  const vision = rpt.vision_echo ?? "";
  const keywords: string[] = rpt.style_keywords ?? [];
  const inspirationLinks: string[] = rpt.inspiration_links ?? [];
  const materials: any[] = rpt.material_recommendations ?? [];
  const lighting = rpt.lighting_simulation ?? {};
  const budget = rpt.total_budget_estimate ?? conceptData.concept?.estimated_budget_impact ?? {};
  const maintenance: any[] = rpt.maintenance_advisory ?? [];
  const whyDesign = rpt.why_this_design ?? "";

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        backPath={backPath}
        rightAction={
          <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloadingPdf ? "Downloading..." : "PDF"}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-4 space-y-5">

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
              <div key={label as string} className="flex items-start justify-between gap-3">
                <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                <span className="text-xs font-medium text-foreground text-right break-words min-w-0">{value}</span>
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
                <div key={i} className="bg-white rounded-xl border border-border/60 p-4 overflow-hidden">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground min-w-0 break-words">{mat.category || mat.name}</p>
                    {mat.cost_range && (
                      <p className="text-sm font-semibold text-foreground shrink-0">
                        {typeof mat.cost_range === "string"
                          ? mat.cost_range
                          : `$${(mat.cost_range.low ?? 0).toLocaleString()}\u2013$${(mat.cost_range.high ?? 0).toLocaleString()}`}
                      </p>
                    )}
                  </div>
                  {mat.description && (
                    <p className="text-xs text-muted-foreground mb-2 break-words">{mat.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {mat.durability && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                        <Shield size={10} className="shrink-0" /> Durability: {mat.durability}
                      </span>
                    )}
                    {mat.maintenance && (
                      <span className="inline-flex items-start gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg break-words">
                        <Wrench size={10} className="shrink-0 mt-0.5" /> Maintenance: {typeof mat.maintenance === "string" ? mat.maintenance : mat.maintenance.level || mat.maintenance}
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
        {(budget.range || budget.min != null || budget.low != null || budget.total) && (
          <section>
            <div className="bg-white rounded-xl border border-border/60 p-4 border-l-4 border-l-[#F59E0B] overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-[#1E3A5F]" />
                <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Total Budget Estimate</h3>
              </div>
              <p className="text-xl font-bold text-[#2BCBBA]">
                {(() => {
                  if (typeof budget === "string") return budget;
                  if (budget.range) return budget.range;
                  const lo = budget.min ?? budget.low;
                  const hi = budget.max ?? budget.high;
                  if (lo != null && hi != null) return `$${lo.toLocaleString()} \u2013 $${hi.toLocaleString()}`;
                  if (budget.total != null) return `$${budget.total.toLocaleString()}`;
                  return "Contact for estimate";
                })()}
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
              {maintenance.map((m: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-border/60 p-3 overflow-hidden flex flex-col">
                  <p className="text-sm font-semibold text-foreground mb-1">{m.item || m.name}</p>
                  {m.frequency && (
                    <p className="text-xs text-muted-foreground mb-2 italic">{m.frequency}</p>
                  )}
                  {(m.task || m.description) && (
                    <p className="text-xs text-muted-foreground">{m.task || m.description}</p>
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
          onClick={() => router.push(backPath)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto py-2"
        >
          <ChevronLeft size={14} /> {fromVault ? "Back to My Documents" : "Back to Design Concepts"}
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
