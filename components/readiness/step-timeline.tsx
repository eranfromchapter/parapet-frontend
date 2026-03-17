'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useIntakeStore } from '@/lib/store';
import { TIMELINE_START_OPTIONS, TIMELINE_COMPLETION_OPTIONS } from '@/lib/constants';

export function StepTimeline() {
  const { timeline, setTimeline } = useIntakeStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">When do you want to start?</h2>
        <p className="mt-1 text-sm text-slate-500">We&apos;ll match you with contractors available in your timeframe.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-700">Desired project start</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TIMELINE_START_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeline({ ...timeline, start: opt.value })}
              className={cn(
                'px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                timeline.start === opt.value
                  ? 'border-gold bg-gold-50 text-navy'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-700">Desired completion timeline</h3>
        <div className="flex flex-wrap gap-3">
          {TIMELINE_COMPLETION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeline({ ...timeline, completion: opt.value })}
              className={cn(
                'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all',
                timeline.completion === opt.value
                  ? 'border-gold bg-gold-50 text-navy'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
