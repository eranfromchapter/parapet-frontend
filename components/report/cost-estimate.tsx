import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CostBreakdownItem } from '@/lib/types';

interface CostEstimateProps {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  breakdown: CostBreakdownItem[];
  confidence_range: string;
}

export function CostEstimate({ p10, p25, p50, p75, p90, breakdown, confidence_range }: CostEstimateProps) {
  const range = p90 - p10;
  const getPosition = (val: number) => ((val - p10) / range) * 100;

  const quantiles = [
    { label: 'P10', value: p10, sublabel: 'Best Case' },
    { label: 'P25', value: p25, sublabel: 'Optimistic' },
    { label: 'P50', value: p50, sublabel: 'Most Likely', highlighted: true },
    { label: 'P75', value: p75, sublabel: 'Conservative' },
    { label: 'P90', value: p90, sublabel: 'Worst Case' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Estimate</CardTitle>
        <p className="text-sm text-slate-500">Probability distribution based on comparable NYC renovations</p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Gradient bar */}
        <div className="relative">
          <div className="h-8 rounded-full overflow-hidden flex">
            <div className="bg-yellow-300 flex-1" style={{ flex: getPosition(p25) }} />
            <div className="bg-gold" style={{ flex: getPosition(p50) - getPosition(p25) }} />
            <div className="bg-navy" style={{ flex: getPosition(p75) - getPosition(p50) }} />
            <div className="bg-slate-400" style={{ flex: 100 - getPosition(p75) }} />
          </div>
          {/* P50 marker */}
          <div
            className="absolute top-[-8px]"
            style={{ left: `${getPosition(p50)}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-navy-700" />
          </div>
        </div>

        {/* Quantile cards */}
        <div className="grid grid-cols-5 gap-2">
          {quantiles.map((q) => (
            <div
              key={q.label}
              className={cn(
                'text-center p-3 rounded-lg',
                q.highlighted ? 'bg-navy text-white' : 'bg-slate-50'
              )}
            >
              <p className={cn('text-xs font-medium', q.highlighted ? 'text-slate-300' : 'text-slate-400')}>
                {q.label}
              </p>
              <p className={cn('text-sm font-bold mt-1', q.highlighted ? 'text-white' : 'text-navy')}>
                {formatCurrency(q.value)}
              </p>
              <p className={cn('text-xs mt-0.5', q.highlighted ? 'text-slate-300' : 'text-slate-400')}>
                {q.sublabel}
              </p>
            </div>
          ))}
        </div>

        {confidence_range && (
          <p className="text-center text-sm text-slate-500">
            80% confidence: {confidence_range}
          </p>
        )}

        {/* Breakdown */}
        {breakdown && breakdown.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-navy">Cost Breakdown</h3>
            <div className="space-y-2">
              {breakdown.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm text-slate-700 w-40 shrink-0">{item.category}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-navy w-24 text-right">{formatCurrency(item.amount)}</span>
                  <span className="text-xs text-slate-400 w-12 text-right">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
