'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api-client';

const STAGES = [
  'Analyzing your project scope',
  'Checking regulatory requirements',
  'Researching comparable projects',
  'Calculating cost estimates',
  'Assessing project risks',
  'Compiling your report',
];

export default function GeneratingPage({ params }: { params: { jobId: string } }) {
  const router = useRouter();
  const { jobId } = params;
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [progress, setProgress] = useState(0);

  const completedStages = Math.min(Math.floor(progress / (100 / STAGES.length)), STAGES.length);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await api.getReadinessReport(jobId);
        if (data.progress_pct) {
          setProgress(data.progress_pct);
        }
        if (data.status === 'completed') {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setProgress(100);
          setTimeout(() => router.push(`/reports/${data.id}`), 500);
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setError(true);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 3000);

    const timerInterval = setInterval(() => {
      setElapsed((e) => {
        if (e >= 120) {
          setTimedOut(true);
          clearInterval(pollInterval);
          clearInterval(timerInterval);
        }
        return e + 1;
      });
      setProgress((p) => {
        if (p < 85) return p + 2;
        return p;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [jobId, router]);

  const handleRetry = () => {
    setError(false);
    setElapsed(0);
    setProgress(0);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="mx-auto max-w-lg px-4 sm:px-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Home className="h-6 w-6 text-navy" />
          <span className="text-xl font-bold text-navy">PARAPET</span>
        </Link>

        {error ? (
          <div className="space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
            <p className="text-slate-500">We couldn&apos;t generate your report. Please try again.</p>
            <Button variant="gold" onClick={handleRetry}>Try Again</Button>
          </div>
        ) : timedOut ? (
          <div className="space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Taking longer than expected</h1>
            <p className="text-slate-500">We&apos;ll email your report when it&apos;s ready. You can safely close this page.</p>
            <Link href="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold text-navy">Generating Your Readiness Report</h1>

            <Progress value={progress} className="h-3" />
            <p className="text-xs text-slate-300">{elapsed}s elapsed</p>

            <div className="space-y-3 text-left">
              {STAGES.map((stage, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i < completedStages ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : i === completedStages ? (
                    <div className="h-5 w-5 shrink-0 flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full bg-gold animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-slate-200 shrink-0" />
                  )}
                  <span className={i <= completedStages ? 'text-sm text-slate-700' : 'text-sm text-slate-300'}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-400">
              This usually takes about 30–60 seconds
            </p>

            <div className="flex justify-center gap-1">
              <div className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
