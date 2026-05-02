'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Download, ArrowRight } from 'lucide-react';
import { useReadinessReport } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ExecutiveSummary } from '@/components/report/executive-summary';
import { ScopeAnalysis } from '@/components/report/scope-analysis';
import { CostEstimate } from '@/components/report/cost-estimate';
import { RiskAssessment } from '@/components/report/risk-assessment';
import { RegulatoryRequirements } from '@/components/report/regulatory-requirements';
import { ContractorGuidance } from '@/components/report/contractor-guidance';
import { MarketContext } from '@/components/report/market-context';
import { NextSteps } from '@/components/report/next-steps';
import { ProvenanceFooter } from '@/components/report/provenance-footer';
import { formatDate } from '@/lib/utils';

export default function ReportPage({ params }: { params: { reportId: string } }) {
  const router = useRouter();
  const { reportId } = params;
  const { data: report, isLoading, error, refetch } = useReadinessReport(reportId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState title="Report not found" message="This report doesn't exist or has been removed." />
      </div>
    );
  }

  // If still processing, redirect to generating page
  if (report.status !== 'completed' || !report.report_json) {
    router.push(`/intake/generating?id=${report.id}`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const r = report.report_json;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-navy" />
              <span className="text-xl font-bold text-navy">PARAPET</span>
            </Link>
            <div className="text-right">
              <h1 className="text-lg font-semibold text-navy">Renovation Readiness Report</h1>
              <p className="text-xs text-slate-400">Generated {formatDate(report.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Executive Summary */}
        {r.executive_summary && (
          <ExecutiveSummary
            summary={r.executive_summary.summary}
            overall_risk={r.executive_summary.overall_risk}
            risk_level={r.executive_summary.risk_level}
          />
        )}

        {/* 2. Scope Analysis */}
        {r.scope_analysis && (
          <ScopeAnalysis
            description={r.scope_analysis.description}
            complexity={r.scope_analysis.complexity}
          />
        )}

        {/* 3. Cost Estimate */}
        {r.cost_estimate && (
          <CostEstimate
            p10={r.cost_estimate.p10}
            p25={r.cost_estimate.p25}
            p50={r.cost_estimate.p50}
            p75={r.cost_estimate.p75}
            p90={r.cost_estimate.p90}
            breakdown={r.cost_estimate.breakdown || []}
            confidence_range={r.cost_estimate.confidence_range}
          />
        )}

        {/* 4. Risk Assessment */}
        {r.risk_assessment && (
          <RiskAssessment
            composite_score={r.risk_assessment.composite_score}
            dimensions={r.risk_assessment.dimensions || []}
          />
        )}

        {/* 5. Regulatory Requirements */}
        {r.regulatory && (
          <RegulatoryRequirements
            permits={r.regulatory.permits || []}
            inspections={r.regulatory.inspections || []}
          />
        )}

        {/* 6. Contractor Guidance */}
        {r.contractor_guidance && (
          <ContractorGuidance
            recommended_trades={r.contractor_guidance.recommended_trades || []}
            vetting_criteria={r.contractor_guidance.vetting_criteria || []}
            red_flags={r.contractor_guidance.red_flags || []}
          />
        )}

        {/* 7. Market Context */}
        {r.market_context && (
          <MarketContext description={r.market_context.description} />
        )}

        {/* 8. Next Steps */}
        {r.next_steps && r.next_steps.length > 0 && (
          <NextSteps steps={r.next_steps} />
        )}

        {/* Provenance */}
        {r.provenance && (
          <ProvenanceFooter
            pipeline_version={r.provenance.pipeline_version}
            generated_at={r.provenance.generated_at}
            models_used={r.provenance.models_used}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Link href="/pricing" className="flex-1">
            <Button variant="gold" className="w-full gap-2">
              Ready to find contractors? Check their credentials for free.
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
