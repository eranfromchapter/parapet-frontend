import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardHat, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ContractorGuidanceProps {
  recommended_trades: string[];
  vetting_criteria: string[];
  red_flags: string[];
}

export function ContractorGuidance({ recommended_trades, vetting_criteria, red_flags }: ContractorGuidanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contractor Screening Guidance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gold uppercase tracking-wide mb-3">
              <HardHat className="h-4 w-4" />
              Recommended Trades
            </h3>
            <ul className="space-y-2">
              {recommended_trades.map((trade, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-gold mt-1">•</span>
                  {trade}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
              <CheckCircle2 className="h-4 w-4" />
              Vetting Criteria
            </h3>
            <ul className="space-y-2">
              {vetting_criteria.map((criteria, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  {criteria}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">
              <AlertTriangle className="h-4 w-4" />
              Red Flags
            </h3>
            <ul className="space-y-2">
              {red_flags.map((flag, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
