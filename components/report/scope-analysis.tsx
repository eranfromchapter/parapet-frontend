import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScopeAnalysisProps {
  description: string;
  complexity: string;
}

export function ScopeAnalysis({ description, complexity }: ScopeAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Scope Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-700 leading-relaxed">{description}</p>
        {complexity && (
          <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md">
            <span className="text-sm font-medium text-slate-500">Complexity:</span>
            <span className="text-sm font-semibold text-navy">{complexity}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
