import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ExecutiveSummaryProps {
  summary: string;
  overall_risk: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
}

export function ExecutiveSummary({ summary, overall_risk, risk_level }: ExecutiveSummaryProps) {
  const badgeVariant = risk_level === 'LOW' ? 'success' : risk_level === 'MODERATE' ? 'warning' : 'danger';

  return (
    <div className="bg-gradient-to-br from-navy to-navy-700 rounded-xl p-8 text-white">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">Executive Summary</h2>
        <Badge variant={badgeVariant} className="text-sm px-3 py-1">
          {risk_level} RISK
        </Badge>
      </div>
      <p className="text-slate-200 leading-relaxed">{summary}</p>
      {overall_risk && (
        <p className="mt-4 text-sm text-slate-300">{overall_risk}</p>
      )}
    </div>
  );
}
