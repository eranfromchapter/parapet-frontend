import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PermitRequirement } from '@/lib/types';

interface RegulatoryRequirementsProps {
  permits: PermitRequirement[];
  inspections: string[];
}

export function RegulatoryRequirements({ permits, inspections }: RegulatoryRequirementsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regulatory Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {permits && permits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Required Permits</h3>
            <div className="grid gap-3">
              {permits.map((permit, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-navy" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy">{permit.type}</p>
                    <p className="text-sm text-slate-500 mt-1">{permit.description}</p>
                  </div>
                  {permit.estimated_days && (
                    <Badge variant="outline" className="shrink-0">
                      Est. {permit.estimated_days} days
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {inspections && inspections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Required Inspections</h3>
            <div className="space-y-2">
              {inspections.map((inspection, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm text-slate-700">{inspection}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
