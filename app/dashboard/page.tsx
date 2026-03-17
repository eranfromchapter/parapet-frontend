'use client';

import React from 'react';
import Link from 'next/link';
import { useReadinessReports } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { Plus, FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { data: reports, isLoading, error, refetch } = useReadinessReports();

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const reportList = Array.isArray(reports) ? reports : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-navy">Your Projects</h1>
        <Link href="/readiness">
          <Button variant="gold" className="gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>

      {reportList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No projects yet</h3>
            <p className="text-sm text-slate-500 mb-6">Get started by creating your first Readiness Report.</p>
            <Link href="/readiness">
              <Button variant="gold">Create Your First Report</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportList.map((report) => {
            const statusVariant = report.status === 'completed' ? 'success' : report.status === 'failed' ? 'danger' : 'warning';
            const href = report.status === 'completed' ? `/reports/${report.id}` : `/generating/${report.id}`;

            return (
              <Link key={report.id} href={href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-medium text-navy">
                        {report.intake_data?.homeType || 'Renovation Project'}
                      </div>
                      <Badge variant={statusVariant}>
                        {report.status}
                      </Badge>
                    </div>
                    {report.intake_data?.budgetRange && (
                      <p className="text-sm text-slate-500">
                        Budget: {formatCurrency(report.intake_data.budgetRange.min)} – {formatCurrency(report.intake_data.budgetRange.max)}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      Created {formatDate(report.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
