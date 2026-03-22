'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle2,
  Info, Download, ArrowRight, Target, MapPin,
  Building2, Landmark, FileText, Leaf, Home,
  ChevronDown, ChevronUp, Scale,
} from "lucide-react";
import ParapetLogo from "@/components/ParapetLogo";
import PageHeader from "@/components/PageHeader";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmt(n: number | null | undefined): string {
  if (n == null) return "Calculating...";
  return "$" + n.toLocaleString("en-US");
}

function fmtK(n: number | null | undefined): string {
  if (n == null) return "...";
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

// Confidence Gauge
function ConfidenceGauge({ value }: { value: number | null | undefined }) {
  const v = value ?? 0;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (v / 100) * circumference;
  const color = v >= 80 ? "#10B981" : v >= 65 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="40" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
        <circle cx="44" cy="44" r="40" fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{value != null ? `${value}%` : "..."}</span>
        <span className="text-[9px] text-muted-foreground">confidence</span>
      </div>
    </div>
  );
}

type JurisdictionStatus = "compliant" | "action_required" | "warning" | "not_applicable";

function JStatusIcon({ status, size = 12 }: { status: JurisdictionStatus; size?: number }) {
  switch (status) {
    case "compliant": return <CheckCircle2 size={size} className="text-emerald-500 shrink-0" />;
    case "action_required": return <AlertTriangle size={size} className="text-amber-500 shrink-0" />;
    case "warning": return <Info size={size} className="text-amber-500 shrink-0" />;
    case "not_applicable": return <span className="text-[10px] text-muted-foreground/50 shrink-0">N/A</span>;
  }
}

const statusLabelMap: Record<JurisdictionStatus, { text: string; color: string }> = {
  compliant: { text: "Compliant", color: "text-emerald-600 dark:text-emerald-400" },
  action_required: { text: "Action Required", color: "text-amber-600 dark:text-amber-400" },
  warning: { text: "Review Needed", color: "text-amber-600 dark:text-amber-400" },
  not_applicable: { text: "N/A", color: "text-muted-foreground" },
};

const sectionIcons: Record<string, typeof MapPin> = {
  zoning: MapPin, "building-code": Building2, landmark: Landmark,
  "coop-hoa": Home, environmental: Leaf, permits: FileText,
};

function JurisdictionSectionCard({ section }: { section: any }) {
  const [expanded, setExpanded] = useState(false);
  const SectionIcon = sectionIcons[section.id] || Scale;
  const sl = statusLabelMap[section.overallStatus as JurisdictionStatus] ?? statusLabelMap.compliant;
  const items: any[] = section.items ?? [];
  const actionCount = items.filter((i: any) => i.status === "action_required" || i.status === "warning").length;

  return (
    <div className="border-b border-border/20 last:border-b-0">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full py-3 text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#1E3A5F]/5 dark:bg-[#1E3A5F]/20 flex items-center justify-center shrink-0">
            <SectionIcon size={14} className="text-[#1E3A5F] dark:text-[#6BA3D6]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{section.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-medium ${sl.color}`}>{sl.text}</span>
              {actionCount > 0 && section.overallStatus !== "compliant" && (
                <span className="text-[10px] text-muted-foreground">&middot; {actionCount} item{actionCount > 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="pb-3 space-y-1.5">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="rounded-md bg-muted/30 px-3 py-2">
              <div className="flex items-start gap-2">
                <div className="mt-0.5"><JStatusIcon status={item.status} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{item.label}</span>
                    <span className="text-[11px] font-medium text-foreground text-right shrink-0">{item.value}</span>
                  </div>
                  {item.detail && <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">{item.detail}</p>}
                </div>
              </div>
            </div>
          ))}
          {section.note && (
            <div className={`rounded-lg border p-2.5 mt-1 ${
              section.overallStatus === "compliant" ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40" :
              section.overallStatus === "action_required" ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40" :
              "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40"
            }`}>
              <p className={`text-[10px] font-medium leading-relaxed ${
                section.overallStatus === "compliant" ? "text-emerald-700 dark:text-emerald-400" :
                section.overallStatus === "action_required" ? "text-amber-700 dark:text-amber-400" :
                "text-blue-700 dark:text-blue-400"
              }`}>{section.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReadinessReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/v1/readiness-reports/${reportId}`);
        if (!res.ok) throw new Error(`Failed to load report: ${res.status}`);
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Report not available</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{error || "Report data is missing."}</p>
        <button onClick={() => router.push("/")} className="text-sm font-medium text-[#1E3A5F] hover:underline">
          Back to home
        </button>
      </div>
    );
  }

  // Extract data with null guards
  const r = report;
  const confidence = r.feasibility_confidence ?? r.confidence ?? null;
  const confidenceRange = r.confidence_range ?? {};
  const costBreakdown: any[] = r.cost_breakdown ?? r.costBreakdown ?? [];
  const timelineScenarios: any[] = r.timeline_scenarios ?? r.timelineScenarios ?? [];
  const jurisdictionSections: any[] = r.jurisdiction_sections ?? r.jurisdictionSections ?? r.jurisdiction ?? [];
  const confidenceDrivers: any[] = r.confidence_drivers ?? r.confidenceDrivers ?? [];
  const deliveryModel = r.delivery_model ?? r.deliveryModel ?? null;
  const aiInsight = r.ai_insight ?? r.aiInsight ?? r.summary ?? r.narrative ?? null;
  const projectTitle = r.project_title ?? r.projectTitle ?? r.title ?? "Renovation";

  const totalLow = costBreakdown.reduce((s: number, c: any) => s + (c.low ?? 0), 0);
  const totalMid = costBreakdown.reduce((s: number, c: any) => s + (c.mid ?? c.estimate ?? 0), 0);
  const totalHigh = costBreakdown.reduce((s: number, c: any) => s + (c.high ?? 0), 0);
  const totalCost = r.total_cost ?? r.totalCost ?? (totalMid > 0 ? totalMid : null);

  const timelineWeeks = r.timeline_weeks ?? r.timelineWeeks ?? (timelineScenarios.find((s: any) => s.label === "Most Likely")?.weeks) ?? null;
  const roi = r.roi ?? r.estimated_roi ?? null;

  return (
    <div>
      <PageHeader
        title="Readiness Report"
        subtitle={`${projectTitle} — Feasibility Analysis`}
        backPath="/dashboard"
        rightAction={
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            <Download size={14} /> PDF
          </Button>
        }
      />

      <div className="px-4 pt-4 pb-4 max-w-3xl mx-auto">
        {/* Feasibility Confidence */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feasibility Confidence</h3>
          </div>
          <div className="flex items-center gap-4">
            <ConfidenceGauge value={confidence} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={12} className="text-[#1E3A5F] dark:text-[#6BA3D6]" />
                <span className="text-[11px] font-semibold text-foreground">
                  Range: {confidenceRange.low ?? "..."}% – {confidenceRange.high ?? "..."}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Based on scope complexity, local market data, and comparable project outcomes.
              </p>
            </div>
          </div>

          {confidenceDrivers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What drives this score</p>
              <div className="space-y-1.5">
                {confidenceDrivers.map((d: any) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-[120px] shrink-0">{d.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${(d.value ?? 0) >= 75 ? "bg-emerald-500" : (d.value ?? 0) >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${d.value ?? 0}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground w-8 text-right">{d.value ?? 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <Card className="p-3 text-center">
            <Clock size={16} className="mx-auto text-[#1E3A5F] dark:text-[#6BA3D6] mb-1" />
            <p className="text-lg font-bold text-foreground">{timelineWeeks ?? "..."}</p>
            <p className="text-[10px] text-muted-foreground">weeks (likely)</p>
          </Card>
          <Card className="p-3 text-center">
            <DollarSign size={16} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
            <p className="text-lg font-bold text-foreground">{totalCost != null ? fmtK(totalCost) : "..."}</p>
            <p className="text-[10px] text-muted-foreground">most likely</p>
          </Card>
          <Card className="p-3 text-center">
            <TrendingUp size={16} className="mx-auto text-cyan-600 dark:text-cyan-400 mb-1" />
            <p className="text-lg font-bold text-foreground">{roi != null ? `${roi}x` : "..."}</p>
            <p className="text-[10px] text-muted-foreground">est. ROI</p>
          </Card>
        </div>

        {/* Timeline Scenarios */}
        {timelineScenarios.length > 0 && (
          <Card className="p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Timeline Scenarios</h3>
            <div className="space-y-2.5">
              {timelineScenarios.map((s: any) => {
                const barColor = s.label === "Best Case" ? "bg-emerald-500" :
                  s.label === "Most Likely" ? "bg-[#1E3A5F] dark:bg-[#6BA3D6]" :
                  s.label === "Conservative" ? "bg-amber-500" : "bg-red-500";
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-foreground">{s.label}</span>
                      <span className="text-xs font-bold text-foreground">{s.weeks ?? "..."}w</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${(s.probability ?? 0) * 2}%` }} />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{s.probability ?? 0}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Cost Breakdown */}
        {costBreakdown.length > 0 && (
          <Card className="p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cost Breakdown</h3>

            <div className="rounded-lg bg-[#1E3A5F]/5 dark:bg-[#1E3A5F]/20 p-2.5 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Total Estimated Cost</span>
                <span className="text-sm font-bold text-[#1E3A5F] dark:text-[#6BA3D6]">{fmt(totalCost)}</span>
              </div>
              {totalLow > 0 && totalHigh > 0 && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">90% confidence range</span>
                  <span className="text-[11px] font-medium text-foreground">{fmt(totalLow)} – {fmt(totalHigh)}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {costBreakdown.map((item: any) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">{fmt(item.mid ?? item.estimate)}</span>
                  </div>
                  {(item.low != null || item.high != null) && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Range: {fmt(item.low)} – {fmt(item.high)}</span>
                      {item.confidence != null && (
                        <span className={`font-medium ${
                          item.confidence >= 85 ? "text-emerald-600 dark:text-emerald-400" :
                          item.confidence >= 75 ? "text-amber-600 dark:text-amber-400" :
                          "text-red-600 dark:text-red-400"
                        }`}>{item.confidence}% conf.</span>
                      )}
                    </div>
                  )}
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-[#1E3A5F] dark:bg-[#6BA3D6] rounded-full"
                      style={{ width: `${item.pct ?? Math.min(100, ((item.mid ?? item.estimate ?? 0) / (totalCost || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Jurisdiction & Zoning */}
        {jurisdictionSections.length > 0 && (
          <Card className="p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Jurisdiction & Zoning Overview</h3>
            <div className="divide-y divide-border/20">
              {jurisdictionSections.map((section: any, i: number) => (
                <JurisdictionSectionCard key={section.id ?? i} section={section} />
              ))}
            </div>
          </Card>
        )}

        {/* Delivery Model */}
        {deliveryModel && (
          <Card className="p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recommended Delivery Model</h3>
            <div className="bg-[#1E3A5F]/5 dark:bg-[#1E3A5F]/20 rounded-xl p-3">
              <p className="text-sm font-semibold text-foreground">{deliveryModel.name ?? deliveryModel}</p>
              {deliveryModel.description && (
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{deliveryModel.description}</p>
              )}
            </div>
          </Card>
        )}

        {/* AI Insight */}
        {aiInsight && (
          <Card className="p-4 border-l-4 border-l-[#2BCBBA] mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-[#2BCBBA]" />
              <h3 className="text-xs font-semibold text-[#2BCBBA]">AI Insight</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{aiInsight}</p>
          </Card>
        )}

        {/* CTA */}
        <Button
          onClick={() => router.push("/services")}
          className="w-full h-12 text-sm font-semibold bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 dark:bg-[#6BA3D6] dark:hover:bg-[#6BA3D6]/90 dark:text-[#0f1c2e] gap-2"
        >
          View Services & Pricing
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
