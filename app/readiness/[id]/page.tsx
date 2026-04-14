'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle2,
  Info, Download, ArrowRight, Target, Shield, ChevronLeft,
  FileText, Users, ListChecks, AlertCircle, Loader2,
} from "lucide-react";
import ParapetLogo from "@/components/ParapetLogo";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

const formatCurrency = (n: number | null | undefined): string =>
  n != null ? `$${n.toLocaleString("en-US")}` : "\u2014";

const formatCurrencyK = (n: number | null | undefined): string => {
  if (n == null) return "\u2014";
  if (n >= 1000) return `$${Math.round(n / 1000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
};

const daysToWeeks = (days: number | null | undefined): number | null =>
  days != null ? Math.round(days / 7) : null;

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000; // 120 seconds

// ── Confidence Gauge (0-10 mapped to 0-100%) ──

function ConfidenceGauge({ score }: { score: number | null | undefined }) {
  const v = score ?? 0;
  const pct = (v / 10) * 100;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (pct / 100) * circumference;
  const color = v <= 3 ? "#10B981" : v <= 6 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="40" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
        <circle cx="44" cy="44" r="40" fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score != null ? score : "\u2014"}</span>
        <span className="text-[9px] text-muted-foreground">/ 10 risk</span>
      </div>
    </div>
  );
}

function RiskLevelBadge({ level }: { level: string | null | undefined }) {
  if (!level) return null;
  const l = level.toUpperCase();
  const colors =
    l === "LOW" ? "bg-emerald-100 text-emerald-800" :
    l === "MODERATE" ? "bg-amber-100 text-amber-800" :
    l === "HIGH" ? "bg-red-100 text-red-800" :
    "bg-red-200 text-red-900";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${colors}`}>
      {l}
    </span>
  );
}

// ── Dimension score bar color ──

function dimBarColor(score: number): string {
  const pct = (score / 10) * 100;
  if (pct >= 80) return "bg-red-500";
  if (pct >= 60) return "bg-amber-500";
  if (pct >= 40) return "bg-[#2BCBBA]";
  return "bg-emerald-500";
}

// ── Page ──

export default function ReadinessReportPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const pollStartRef = useRef<number>(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";
      const res = await fetch(`${apiBase}/v1/readiness-reports/${reportId}/pdf`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1] || `PARAPET_Readiness_Report_${reportId}.pdf`;
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

  const fetchReport = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";
      const res = await fetch(`${apiUrl}/v1/readiness-reports/${reportId}`, {
        headers: getAuthHeaders(),
      });

      if (res.status === 404) {
        setError("Report not found");
        setLoading(false);
        setGenerating(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load report: ${res.status}`);
      }

      const data = await res.json();

      if (data.detail) {
        setError(data.detail);
        setLoading(false);
        setGenerating(false);
        return;
      }

      if (data.status === "failed") {
        setError("Report generation failed. Please try again.");
        setLoading(false);
        setGenerating(false);
        return;
      }

      // Report is ready — has report_json
      if (data.report_json) {
        setReport(data);
        setLoading(false);
        setGenerating(false);
        // Stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return;
      }

      // Still processing — start polling if not already
      setLoading(false);
      setGenerating(true);

      if (!pollStartRef.current) {
        pollStartRef.current = Date.now();
      }

      // Check poll timeout
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        setGenerating(false);
        setError("Report generation is taking longer than expected. Please refresh the page or try again later.");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
      setLoading(false);
      setGenerating(false);
    }
  }, [reportId]);

  // Initial fetch
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Start polling when in generating state
  useEffect(() => {
    if (generating && !pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(fetchReport, POLL_INTERVAL_MS);
    }
    if (!generating && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [generating, fetchReport]);

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex items-center justify-center bg-background shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <ParapetLogo size={48} className="text-[#1E3A5F] animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 shadow-xl">
        <div className="relative w-16 h-16 mb-6">
          <svg className="w-16 h-16 animate-[spin_2.5s_linear_infinite]" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="hsl(var(--muted))" strokeWidth="3" />
            <path d="M40 4 A36 36 0 0 1 76 40" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <ParapetLogo size={22} className="text-[#1E3A5F]" />
          </div>
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">Still generating your report...</h1>
        <p className="text-sm text-muted-foreground text-center">This usually takes 20{'\u2013'}30 seconds. Hang tight.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 shadow-xl">
        <ParapetLogo size={48} className="text-[#1E3A5F] mb-6" />
        <h1 className="text-lg font-bold text-foreground mb-2">Report not available</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{error || "Report data is missing."}</p>
        <button onClick={() => router.push("/dashboard")} className="text-sm font-medium text-[#1E3A5F] hover:underline">Back to home</button>
      </div>
    );
  }

  // ── Extract from report.report_json ──
  const rj = report?.report_json ?? {};
  const formData = report?.form_data ?? report?.intake_data ?? {};

  // Cost
  const costEst = rj?.cost_estimate ?? {};
  const costDist = costEst?.cost_distribution ?? {};
  const schedDist = costEst?.schedule_distribution ?? {};
  const p10Cost = costDist?.p10 ?? null;
  const p50Cost = costDist?.p50 ?? null;
  const p90Cost = costDist?.p90 ?? null;
  const p50Days = schedDist?.p50 ?? null;
  const p10Days = schedDist?.p10 ?? null;
  const p75Days = schedDist?.p75 ?? null;
  const p90Days = schedDist?.p90 ?? null;
  const contingencyPct = costEst?.contingency_pct ?? null;
  const confidenceDesc = costEst?.confidence_interval_description ?? null;
  const methodologyNotes: string[] = costEst?.methodology_notes ?? [];
  const sourceAttribution = costEst?.source_attribution ?? null;
  const breakdownByCategory: any[] = costEst?.breakdown_by_category ?? [];

  // Risk
  const riskAssessment = rj?.risk_assessment ?? {};
  const compositeScore = riskAssessment?.composite_score ?? null;
  const riskLevel = riskAssessment?.risk_level ?? null;
  const dimensionScores: any[] = riskAssessment?.dimension_scores ?? [];
  const mitigations: string[] = riskAssessment?.mitigations ?? [];

  // Regulatory
  const regData = rj?.regulatory_data ?? {};
  const permitsRequired: any[] = regData?.permits_required ?? [];
  const regTimelineImpact = regData?.estimated_timeline_impact_days ?? null;
  const regWarnings: string[] = regData?.warnings ?? [];
  const inspectionsRequired: string[] = regData?.inspections_required ?? [];
  const coopApproval = regData?.coop_board_approval ?? null;
  const noiseRestrictions = regData?.noise_restrictions ?? null;

  // Contractor guidance
  const contractorGuidance = rj?.contractor_guidance ?? {};
  const recommendedHires: string[] = contractorGuidance?.recommended_hires ?? [];
  const vettingCriteria: string[] = contractorGuidance?.vetting_criteria ?? [];
  const redFlags: string[] = contractorGuidance?.red_flags ?? [];

  // Other
  const executiveSummary = rj?.executive_summary ?? null;
  const scopeAnalysis = rj?.scope_analysis ?? null;
  const nextSteps: string[] = rj?.next_steps ?? [];
  const calibration = rj?.calibration ?? {};
  const provenance = rj?.provenance ?? {};
  const historicalAccuracy = calibration?.historical_accuracy_pct ?? null;

  // Derived
  const timelineWeeks = daysToWeeks(p50Days);
  const timelineRangeLow = daysToWeeks(p10Days);
  const timelineRangeHigh = daysToWeeks(p90Days);

  const homeType = formData?.home_type ?? formData?.homeType ?? formData?.property_type ?? "Renovation";
  const scope: string[] = formData?.scope ?? formData?.renovation_scope ?? [];
  const projectLabel = scope.length > 0
    ? scope.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")).join(", ")
    : homeType;
  const propertyAddress = formData?.property_address ?? formData?.propertyAddress ?? "";
  const zipCode = formData?.zip_code ?? formData?.zipCode ?? "";

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-background relative shadow-xl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/dashboard")} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft size={22} className="text-foreground" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">Readiness Report</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">{projectLabel} {'\u2014'} Feasibility Analysis</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloadingPdf ? "Downloading..." : "PDF"}
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 pt-4 pb-4 safe-bottom overflow-y-auto">

        {/* ── Feasibility Confidence ── */}
        <Card className="p-4 mb-4 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Feasibility Confidence</h3>
            <RiskLevelBadge level={riskLevel} />
          </div>

          <div className="flex items-center gap-4">
            <ConfidenceGauge score={compositeScore} />
            <div className="flex-1 min-w-0">
              {confidenceDesc && (
                <p className="text-[11px] font-semibold text-foreground mb-1">{confidenceDesc}</p>
              )}
              {historicalAccuracy != null && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-[#1E3A5F]" />
                  <span className="text-[11px] text-muted-foreground">Historical accuracy: {historicalAccuracy}%</span>
                </div>
              )}
            </div>
          </div>

          {/* What Drives This Score */}
          {dimensionScores.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What drives this score</p>
              <div className="space-y-1.5">
                {dimensionScores.map((d: any) => {
                  const s = d.score ?? 0;
                  const pct = (s / 10) * 100;
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-[120px] shrink-0 capitalize">{(d.name ?? "").replace(/_/g, " ")}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${dimBarColor(s)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-medium text-foreground w-8 text-right">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mitigations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended Mitigations</p>
              <ul className="space-y-1">
                {mitigations.map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-foreground leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* ── Key Metrics Row ── */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <Card className="p-3 text-center rounded-xl border border-border/50">
            <Clock size={16} className="mx-auto text-[#1E3A5F] mb-1" />
            <p className="text-lg font-bold text-foreground">{timelineWeeks ?? "\u2014"}</p>
            <p className="text-[10px] text-muted-foreground">weeks (likely)</p>
            {timelineRangeLow != null && timelineRangeHigh != null && (
              <p className="text-[9px] text-muted-foreground mt-0.5">range: {timelineRangeLow}{'\u2013'}{timelineRangeHigh}w</p>
            )}
          </Card>
          <Card className="p-3 text-center rounded-xl border border-border/50">
            <DollarSign size={16} className="mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-foreground">{formatCurrencyK(p50Cost)}</p>
            <p className="text-[10px] text-muted-foreground">most likely</p>
            {p10Cost != null && p90Cost != null && (
              <p className="text-[9px] text-muted-foreground mt-0.5">{formatCurrencyK(p10Cost)}{'\u2013'}{formatCurrencyK(p90Cost)}</p>
            )}
          </Card>
          <Card className="p-3 text-center rounded-xl border border-border/50">
            <TrendingUp size={16} className="mx-auto text-[#2BCBBA] mb-1" />
            <p className="text-lg font-bold text-foreground">
              {p10Cost != null && p90Cost != null ? `${formatCurrencyK(p10Cost)}\u2013${formatCurrencyK(p90Cost)}` : "\u2014"}
            </p>
            <p className="text-[10px] text-muted-foreground">est. range (80% CI)</p>
          </Card>
        </div>

        {/* ── Timeline Scenarios ── */}
        {p50Days != null && (
          <Card className="p-4 mb-4 rounded-xl border border-border/50">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Timeline Scenarios</h3>
            <div className="space-y-2.5">
              {[
                { label: "Best Case", days: p10Days, color: "bg-emerald-500", textColor: "text-emerald-600", pct: 20 },
                { label: "Most Likely", days: p50Days, color: "bg-[#1E3A5F]", textColor: "text-[#1E3A5F]", pct: 55 },
                { label: "Conservative", days: p75Days, color: "bg-amber-500", textColor: "text-amber-600", pct: 20 },
                { label: "Worst Case", days: p90Days, color: "bg-red-500", textColor: "text-red-600", pct: 5 },
              ].filter(s => s.days != null).map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-semibold ${s.textColor}`}>{s.label}</span>
                    <span className="text-xs font-bold text-foreground">{daysToWeeks(s.days)}w</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct * 2}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{s.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Cost Breakdown ── */}
        <Card className="p-4 mb-4 rounded-xl border border-border/50">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cost Breakdown</h3>

          {/* Total */}
          <div className="rounded-lg bg-[#1E3A5F]/5 p-2.5 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Total Estimated Cost</span>
              <span className="text-sm font-bold text-[#1E3A5F]">{formatCurrency(p50Cost)}</span>
            </div>
            {p10Cost != null && p90Cost != null && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">90% confidence range</span>
                <span className="text-[11px] font-medium text-foreground">{formatCurrency(p10Cost)} {'\u2013'} {formatCurrency(p90Cost)}</span>
              </div>
            )}
          </div>

          {/* Category breakdown */}
          {breakdownByCategory.length > 0 && (
            <div className="space-y-3 mb-3">
              {breakdownByCategory.map((item: any, i: number) => {
                const amount = item.amount ?? 0;
                const pct = item.percentage ?? (p50Cost ? Math.round((amount / p50Cost) * 100) : 0);
                return (
                  <div key={item.category ?? i}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground">{item.category}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#1E3A5F]" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <span className="text-[10px] font-medium text-[#2BCBBA] w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contingency */}
          {contingencyPct != null && (
            <div className="flex items-center justify-between text-[11px] py-2 border-t border-border/30">
              <span className="text-muted-foreground">Contingency</span>
              <span className="font-semibold text-foreground">{Math.round(contingencyPct * 100)}%</span>
            </div>
          )}

          {/* Methodology */}
          {methodologyNotes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Methodology</p>
              <ul className="space-y-0.5">
                {methodologyNotes.map((note, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                    <span className="text-muted-foreground/50 mt-0.5">&bull;</span> {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sourceAttribution && (
            <p className="text-[9px] text-muted-foreground/70 mt-2 italic">{sourceAttribution}</p>
          )}
        </Card>

        {/* ── Scope Analysis ── */}
        {scopeAnalysis && (
          <Card className="p-4 mb-4 rounded-xl border border-border/50">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Scope Analysis</h3>
            <p className="text-xs text-foreground leading-relaxed">{scopeAnalysis}</p>
          </Card>
        )}

        {/* ── Regulatory & Permits ── */}
        {(permitsRequired.length > 0 || regWarnings.length > 0 || coopApproval?.required) && (
          <Card className="p-4 mb-4 rounded-xl border border-border/50">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jurisdiction & Zoning Overview</h3>

            {/* Property info */}
            {(propertyAddress || zipCode) && (
              <div className="rounded-lg bg-[#1E3A5F]/5 p-3 mb-3">
                <p className="text-xs font-semibold text-foreground">{propertyAddress || "Property"}{zipCode ? `, ${zipCode}` : ""}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{homeType}</p>
              </div>
            )}

            {/* Timeline impact */}
            {regTimelineImpact != null && regTimelineImpact > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200/50">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-800 font-medium">
                  Estimated permit timeline impact: {regTimelineImpact} days ({Math.round(regTimelineImpact / 7)} weeks)
                </p>
              </div>
            )}

            {/* Permits — handle both objects and strings */}
            {permitsRequired.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} className="text-[#1E3A5F]" /> Permits Required
                </p>
                <ul className="space-y-1.5">
                  {permitsRequired.map((p: any, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={10} className="text-[#1E3A5F] mt-0.5 shrink-0" />
                      <div className="text-[11px] text-foreground leading-relaxed">
                        {typeof p === "string" ? (
                          p
                        ) : (
                          <>
                            <span className="font-medium">{p?.permit_type || p?.description || "Permit"}</span>
                            {p?.description && p?.permit_type && <span className="text-muted-foreground"> — {p.description}</span>}
                            {p?.estimated_processing_days && (
                              <span className="text-muted-foreground"> ({p.estimated_processing_days} days)</span>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {regWarnings.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-amber-500" /> Warnings
                </p>
                <ul className="space-y-1">
                  {regWarnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-md bg-amber-50/50">
                      <AlertTriangle size={10} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-foreground leading-relaxed">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Co-op board */}
            {coopApproval?.required && (
              <div className="mb-3 p-3 rounded-lg bg-[#1E3A5F]/5">
                <p className="text-[11px] font-semibold text-foreground mb-1">Co-op Board Approval Required</p>
                {coopApproval.typical_weeks && (
                  <p className="text-[10px] text-muted-foreground">Typical timeline: {coopApproval.typical_weeks} weeks</p>
                )}
                {(coopApproval.requirements?.length ?? 0) > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {coopApproval.requirements.map((r: string, i: number) => (
                      <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5"><span>&bull;</span> {r}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Noise */}
            {noiseRestrictions && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-foreground mb-1">Noise Restrictions</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  {noiseRestrictions.weekday_hours && <div>Weekday: <span className="text-foreground font-medium">{noiseRestrictions.weekday_hours}</span></div>}
                  {noiseRestrictions.weekend_hours && <div>Weekend: <span className="text-foreground font-medium">{noiseRestrictions.weekend_hours}</span></div>}
                </div>
              </div>
            )}

            {/* Inspections */}
            {inspectionsRequired.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-foreground mb-1">Inspections Required</p>
                <ul className="space-y-0.5">
                  {inspectionsRequired.map((insp, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5"><span>&bull;</span> {insp}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* ── Contractor Guidance / Delivery Model ── */}
        {(recommendedHires.length > 0 || vettingCriteria.length > 0 || redFlags.length > 0) && (
          <Card className="p-4 mb-4 rounded-xl border border-border/50">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contractor Guidance</h3>

            {recommendedHires.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Users size={12} className="text-[#1E3A5F]" /> Recommended Hires
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recommendedHires.map((h, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#1E3A5F]/5 text-[11px] font-medium text-foreground">{h}</span>
                  ))}
                </div>
              </div>
            )}

            {vettingCriteria.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-foreground mb-1.5">Vetting Criteria</p>
                <ul className="space-y-1">
                  {vettingCriteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Shield size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-foreground leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {redFlags.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-red-600 mb-1.5">Red Flags to Watch</p>
                <ul className="space-y-1">
                  {redFlags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle size={10} className="text-red-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-foreground leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* ── AI Insight ── */}
        {executiveSummary && (
          <Card className="p-4 mb-4 rounded-xl border border-border/50 border-l-4 border-l-[#2BCBBA]">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-[#2BCBBA]" />
              <h3 className="text-xs font-semibold text-[#2BCBBA]">AI Insight</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{executiveSummary}</p>
          </Card>
        )}

        {/* ── Next Steps ── */}
        {nextSteps.length > 0 && (
          <Card className="p-4 mb-4 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks size={14} className="text-[#1E3A5F]" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next Steps</h3>
            </div>
            <ol className="space-y-2">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1E3A5F] text-white text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs text-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* ── Provenance ── */}
        {(provenance?.pipeline_version || (provenance?.data_sources?.length ?? 0) > 0) && (
          <Card className="p-4 mb-4 rounded-xl border border-border/50 bg-muted/20">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Data Provenance</h3>
            <div className="space-y-1 text-[10px] text-muted-foreground">
              {provenance.pipeline_version && <p>Pipeline: <span className="font-medium text-foreground">v{provenance.pipeline_version}</span></p>}
              {provenance.generated_at && <p>Generated: <span className="font-medium text-foreground">{new Date(provenance.generated_at).toLocaleString()}</span></p>}
              {(provenance.data_sources?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-0.5">Sources:</p>
                  <ul className="ml-2 space-y-0.5">
                    {provenance.data_sources.map((src: string, i: number) => (
                      <li key={i} className="flex items-start gap-1"><span className="text-muted-foreground/50">&bull;</span> <span className="text-foreground">{src}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {provenance.confidence_scores && (
                <div>
                  <p className="mb-0.5">Confidence:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 ml-2">
                    {Object.entries(provenance.confidence_scores).map(([node, score]) => (
                      <div key={node} className="flex justify-between">
                        <span className="capitalize">{node.replace(/_/g, " ")}</span>
                        <span className="font-medium text-foreground">{typeof score === "number" ? `${Math.round(score * 100)}%` : String(score)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── CTA ── */}
        <Button
          onClick={() => router.push("/services")}
          className="w-full h-12 text-sm font-semibold bg-[#1E3A5F] hover:bg-[#2A4F7A] gap-2 rounded-xl shadow-lg shadow-[#1E3A5F]/20"
        >
          View Services & Pricing
          <ArrowRight size={16} />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
