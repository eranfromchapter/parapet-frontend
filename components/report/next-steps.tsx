import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NextStepsProps {
  steps: string[];
}

export function NextSteps({ steps }: NextStepsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center shrink-0 text-sm font-bold">
                {i + 1}
              </div>
              <p className="text-slate-700 pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
