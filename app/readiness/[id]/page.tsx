'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle2,
  Info, Download, ArrowRight, Target, Shield,
  FileText, Users, ListChecks, AlertCircle,
} from "lucide-react";
import ParapetLogo from "@/components/ParapetLogo";
import PageHeader from "@/components/PageHeader";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Formatters ──────────────────────────────────────────────────────────

const formatCurrency = (n: number | null | undefined): string =>
  n != null ? `$${n.toLocaleString("en-US")}` : "\u2014";

const formatCurrencyK = (n: number | null | undefined): string => {
  if (n == null) return "\u2014";
  if (n >= 1000) return `$${Math.round(n / 1000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
};

const daysToWeeks = (days: number | null | undefined): number | null =>
  days != null ? Math.round(days / 7) : null;

// ── Risk Score Gauge (0-10 scale) ───────────────────────────────────────

function RiskScoreGauge({ score }: { score: number | null | undefined }) {
  const v = score ?? 0;
  const maxScore = 10;
  const pct = (v / maxScore) * 100;
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
    l === "LOW" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
    l === "MODERATE" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
    l === "HIGH" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
    "bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${colors}`}>
      {l}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";
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

  // ── Extract from report.report_json ─────────────────────────────────
  const rj = report?.report_json ?? {};
  const formData = report?.form_data ?? report?.intake_data ?? {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

  // Cost estimate
  const costEst = rj?.cost_estimate ?? {};
  const costDist = costEst?.cost_distribution ?? {};
  const schedDist = costEst?.schedule_distribution ?? {};
  const p10Cost = costDist?.p10 ?? null;
  const p25Cost = costDist?.p25 ?? null;
  const p50Cost = costDist?.p50 ?? null;
  const p75Cost = costDist?.p75 ?? null;
  const p90Cost = costDist?.p90 ?? null;
  const p50Days = schedDist?.p50 ?? null;
  const p10Days = schedDist?.p10 ?? null;
  const p90Days = schedDist?.p90 ?? null;
  const contingencyPct = costEst?.contingency_pct ?? null;
  const confidenceDesc = costEst?.confidence_interval_description ?? null;
  const methodologyNotes: string[] = costEst?.methodology_notes ?? [];
  const sourceAttribution = costEst?.source_attribution ?? null;
  const comparableCount = costEst?.comparable_projects_count ?? null;

  // Risk assessment
  const riskAssessment = rj?.risk_assessment ?? {};
  const compositeScore = riskAssessment?.composite_score ?? null;
  const riskLevel = riskAssessment?.risk_level ?? null;
  const dimensionScores: any[] = riskAssessment?.dimension_scores ?? [];
  const riskMitigations: string[] = riskAssessment?.mitigations ?? [];

  // Regulatory
  const regData = rj?.regulatory_data ?? {};
  const permitsRequired: string[] = regData?.permits_required ?? [];
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

  // Other sections
  const executiveSummary = rj?.executive_summary ?? null;
  const scopeAnalysis = rj?.scope_analysis ?? null;
  const marketContext = rj?.market_context ?? null;
  const nextSteps: string[] = rj?.next_steps ?? [];

  // Calibration / provenance
  const calibration = rj?.calibration ?? {};
  const provenance = rj?.provenance ?? {};
  const historicalAccuracy = calibration?.historical_accuracy_pct ?? null;

  // Timeline in weeks
  const timelineWeeks = daysToWeeks(p50Days);
  const timelineRangeLow = daysToWeeks(p10Days);
  const timelineRangeHigh = daysToWeeks(p90Days);

  // Project title from form data
  const homeType = formData?.home_type ?? formData?.homeType ?? formData?.property_type ?? "Renovation";
  const scope: string[] = formData?.scope ?? formData?.renovation_scope ?? [];
  const projectLabel = scope.length > 0
    ? `${scope.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")).join(", ")} \u2014 ${homeType}`
    : homeType;

  return (
    <div>
      <PageHeader
        title="Readiness Report"
        subtitle={`${projectLabel} \u2014 Feasibility Analysis`}
        backPath="/"
        rightAction={
          <a
            href={`${apiUrl}/v1/readiness-reports/${reportId}/html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm" className="text-xs gap-1.5">
              <Download size={14} /> PDF
            </Button>
          </a>
        }
      />

      <div className="px-4 pt-4 pb-8 max-w-3xl mx-auto">

        {/* ── Executive Summary ─────────────────────────────────────── */}
        {executiveSummary && (
          <Card className="p-4 mb-4 border-l-4 border-l-[#1E3A5F]">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-[#1E3A5F]" />
              <h3 className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider">Executive Summary</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{executiveSummary}</p>
          </Card>
        )}

        {/* ── Risk / Feasibility Score ─────────────────────────────── */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Feasibility & Risk Assessment
            </h3>
            <RiskLevelBadge level={riskLevel} />
          </div>

          <div className="flex items-center gap-4">
            <RiskScoreGauge score={compositeScore} />
            <div className="flex-1 min-w-0">
              {confidenceDesc && (
                <p className="text-[11px] font-semibold text-foreground mb-1">{confidenceDesc}</p>
              )}
              {historicalAccuracy != null && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-[#1E3A5F] dark:text-[#6BA3D6]" />
                  <span className="text-[11px] text-muted-foreground">
                    Historical accuracy: {historicalAccuracy}%
                  </span>
                </div>
              )}
              {comparableCount != null && (
                <p className="text-[10px] text-muted-foreground">
                  Based on {comparableCount} comparable project{comparableCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Dimension scores */}
          {dimensionScores.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Risk Dimensions
              </p>
              <div className="space-y-2">
                {dimensionScores.map((d: any) => (
                  <div key={d.name}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] text-foreground font-medium w-[140px] shrink-0 capitalize">
                        {(d.name ?? "").replace(/_/g, " ")}
                      </span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (d.score ?? 0) <= 3 ? "bg-emerald-500" :
                            (d.score ?? 0) <= 6 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${((d.score ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-foreground w-8 text-right">
                        {d.score ?? 0}/10
                      </span>
                    </div>
                    {d.explanation && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed ml-[148px]">{d.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk mitigations */}
          {riskMitigations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Recommended Mitigations
              </p>
              <ul className="space-y-1">
                {riskMitigations.map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-foreground leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* ── Key Metrics Row ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <Card className="p-3 text-center">
            <Clock size={16} className="mx-auto text-[#1E3A5F] dark:text-[#6BA3D6] mb-1" />
            <p className="text-lg font-bold text-foreground">{timelineWeeks ?? "\u2014"}</p>
            <p className="text-[10px] text-muted-foreground">weeks (likely)</p>
            {timelineRangeLow != null && timelineRangeHigh != null && (
              <p className="text-[9px] text-muted-foreground mt-0.5">range: {timelineRangeLow}\u2013{timelineRangeHigh}w</p>
            )}
          </Card>
          <Card className="p-3 text-center">
            <DollarSign size={16} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
            <p className="text-lg font-bold text-foreground">{formatCurrencyK(p50Cost)}</p>
            <p className="text-[10px] text-muted-foreground">most likely</p>
            {p10Cost != null && p90Cost != null && (
              <p className="text-[9px] text-muted-foreground mt-0.5">{formatCurrencyK(p10Cost)}\u2013{formatCurrencyK(p90Cost)}</p>
            )}
          </Card>
          <Card className="p-3 text-center">
            <TrendingUp size={16} className="mx-auto text-cyan-600 dark:text-cyan-400 mb-1" />
            <p className="text-lg font-bold text-foreground">
              {p10Cost != null && p90Cost != null ? `${formatCurrencyK(p10Cost)}\u2013${formatCurrencyK(p90Cost)}` : "\u2014"}
            </p>
            <p className="text-[10px] text-muted-foreground">est. range (80% CI)</p>
          </Card>
        </div>

        {/* ── Cost Estimate ────────────────────────────────────────── */}
        <Card className="p-4 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Cost Estimate
          </h3>

          {/* Cost distribution bar */}
          <div className="rounded-lg bg-[#1E3A5F]/5 dark:bg-[#1E3A5F]/20 p-3 mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-muted-foreground">Most Likely (P50)</span>
              <span className="text-sm font-bold text-[#1E3A5F] dark:text-[#6BA3D6]">{formatCurrency(p50Cost)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>80% confidence range</span>
              <span className="font-medium text-foreground">{formatCurrency(p10Cost)} \u2013 {formatCurrency(p90Cost)}</span>
            </div>
          </div>

          {/* P-values visualization */}
          <div className="space-y-2 mb-3">
            {[
              { label: "Optimistic (P10)", value: p10Cost, pct: 10 },
              { label: "Low (P25)", value: p25Cost, pct: 25 },
              { label: "Most Likely (P50)", value: p50Cost, pct: 50 },
              { label: "High (P75)", value: p75Cost, pct: 75 },
              { label: "Conservative (P90)", value: p90Cost, pct: 90 },
            ].filter(d => d.value != null).map((d) => {
              const maxVal = p90Cost || 1;
              const barWidth = Math.min(100, ((d.value ?? 0) / maxVal) * 100);
              const barColor = d.pct <= 25 ? "bg-emerald-500" : d.pct <= 50 ? "bg-[#1E3A5F] dark:bg-[#6BA3D6]" : d.pct <= 75 ? "bg-amber-500" : "bg-red-400";
              return (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(d.value)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Schedule distribution */}
          {p50Days != null && (
            <div className="rounded-lg bg-muted/30 p-3 mb-3">
              <p className="text-[11px] font-semibold text-foreground mb-1">Schedule Estimate</p>
              <div className="grid grid-cols-3 gap-3 text-center text-[10px]">
                <div>
                  <p className="font-bold text-foreground">{daysToWeeks(p10Days) ?? "\u2014"}w</p>
                  <p className="text-muted-foreground">Best case</p>
                </div>
                <div>
                  <p className="font-bold text-[#1E3A5F] dark:text-[#6BA3D6] text-sm">{daysToWeeks(p50Days) ?? "\u2014"}w</p>
                  <p className="text-muted-foreground">Most likely</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">{daysToWeeks(p90Days) ?? "\u2014"}w</p>
                  <p className="text-muted-foreground">Conservative</p>
                </div>
              </div>
            </div>
          )}

          {/* Contingency */}
          {contingencyPct != null && (
            <div className="flex items-center justify-between text-[11px] py-2 border-t border-border/30">
              <span className="text-muted-foreground">Contingency</span>
              <span className="font-semibold text-foreground">{Math.round(contingencyPct * 100)}%</span>
            </div>
          )}

          {/* Methodology notes */}
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

          {/* Source attribution */}
          {sourceAttribution && (
            <p className="text-[9px] text-muted-foreground/70 mt-2 italic">{sourceAttribution}</p>
          )}
        </Card>

        {/* ── Scope Analysis ───────────────────────────────────────── */}
        {scopeAnalysis && (
          <Card className="p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scope Analysis</h3>
            <p className="text-xs text-foreground leading-relaxed">{scopeAnalysis}</p>
          </Card>
        )}

        {/* ── Regulatory Section ───────────────────────────────────── */}
        {(permitsRequired.length > 0 || regWarnings.length > 0 || coopApproval?.required) && (
          <Card className="p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Regulatory & Permits
            </h3>

            {/* Timeline impact */}
            {regTimelineImpact != null && regTimelineImpact > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  Estimated permit timeline impact: {regTimelineImpact} days ({Math.round(regTimelineImpact / 7)} weeks)
                </p>
              </div>
            )}

            {/* Permits required */}
            {permitsRequired.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} className="text-[#1E3A5F]" /> Permits Required
                </p>
                <ul className="space-y-1">
                  {permitsRequired.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={10} className="text-[#1E3A5F] mt-0.5 shrink-0" />
                      <span className="text-[11px] text-foreground">{p}</span>
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
                    <li key={i} className="flex items-start gap-2 p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20">
                      <AlertTriangle size={10} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-foreground leading-relaxed">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Co-op board approval */}
            {coopApproval?.required && (
              <div className="mb-3 p-3 rounded-lg bg-[#1E3A5F]/5 dark:bg-[#1E3A5F]/20">
                <p className="text-[11px] font-semibold text-foreground mb-1">Co-op Board Approval Required</p>
                {coopApproval.typical_weeks && (
                  <p className="text-[10px] text-muted-foreground">Typical timeline: {coopApproval.typical_weeks} weeks</p>
                )}
                {(coopApproval.requirements?.length ?? 0) > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {coopApproval.requirements.map((r: string, i: number) => (
                      <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                        <span>&bull;</span> {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Noise restrictions */}
            {noiseRestrictions && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-foreground mb-1">Noise Restrictions</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  {noiseRestrictions.weekday_hours && <div>Weekday: <span className="text-foreground font-medium">{noiseRestrictions.weekday_hours}</span></div>}
                  {noiseRestrictions.weekend_hours && <div>Weekend: <span className="text-foreground font-medium">{noiseRestrictions.weekend_hours}</span></div>}
                  {noiseRestrictions.holidays && <div className="col-span-2">Holidays: <span className="text-foreground font-medium">{noiseRestrictions.holidays}</span></div>}
                </div>
              </div>
            )}

            {/* Inspections */}
            {inspectionsRequired.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-foreground mb-1">Inspections Required</p>
                <ul className="space-y-0.5">
                  {inspectionsRequired.map((insp, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                      <span>&bull;</span> {insp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* ── Contractor Guidance ──────────────────────────────────── */}
        {(recommendedHires.length > 0 || vettingCriteria.length > 0 || redFlags.length > 0) && (
          <Card className="p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Contractor Guidance
            </h3>

            {recommendedHires.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Users size={12} className="text-[#1E3A5F]" /> Recommended Hires
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recommendedHires.map((h, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#1E3A5F]/5 dark:bg-[#1E3A5F]/20 text-[11px] font-medium text-foreground">
                      {h}
                    </span>
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
                <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1.5">Red Flags to Watch</p>
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

        {/* ── Market Context ───────────────────────────────────────── */}
        {marketContext && (
          <Card className="p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Market Context</h3>
            <p className="text-xs text-foreground leading-relaxed">{marketContext}</p>
          </Card>
        )}

        {/* ── Next Steps ───────────────────────────────────────────── */}
        {nextSteps.length > 0 && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks size={14} className="text-[#1E3A5F]" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Steps</h3>
            </div>
            <ol className="space-y-2">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1E3A5F] text-white text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* ── Provenance ───────────────────────────────────────────── */}
        {(provenance?.pipeline_version || (provenance?.data_sources?.length ?? 0) > 0 || provenance?.generated_at) && (
          <Card className="p-4 mb-4 bg-muted/20">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Data Provenance</h3>
            <div className="space-y-1 text-[10px] text-muted-foreground">
              {provenance.pipeline_version && (
                <p>Pipeline version: <span className="font-medium text-foreground">{provenance.pipeline_version}</span></p>
              )}
              {provenance.generated_at && (
                <p>Generated: <span className="font-medium text-foreground">{new Date(provenance.generated_at).toLocaleString()}</span></p>
              )}
              {(provenance.data_sources?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-0.5">Data sources:</p>
                  <ul className="ml-2 space-y-0.5">
                    {provenance.data_sources.map((src: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-muted-foreground/50">&bull;</span>
                        <span className="text-foreground">{src}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {provenance.confidence_scores && (
                <div>
                  <p className="mb-0.5">Confidence by node:</p>
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

        {/* ── CTA ──────────────────────────────────────────────────── */}
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
