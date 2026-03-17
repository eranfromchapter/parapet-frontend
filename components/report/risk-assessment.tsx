import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RiskDimension } from '@/lib/types';

interface RiskAssessmentProps {
  composite_score: number;
  dimensions: RiskDimension[];
}

function getScoreColor(score: number) {
  if (score <= 3) return 'bg-green-500 text-white';
  if (score <= 6) return 'bg-amber-500 text-white';
  return 'bg-red-500 text-white';
}

export function RiskAssessment({ composite_score, dimensions }: RiskAssessmentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
        <p className="text-sm text-slate-500">Composite score: {composite_score}/10</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map((dim, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold', getScoreColor(dim.score))}>
                {dim.score}
              </div>
              <div>
                <p className="font-semibold text-navy">{dim.name}</p>
                <p className="text-sm text-slate-500 mt-1">{dim.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
