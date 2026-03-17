'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { STEP_LABELS } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function ProgressBar({ currentStep, onStepClick }: ProgressBarProps) {
  const progress = ((currentStep + 1) / STEP_LABELS.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">
          Step {currentStep + 1} of {STEP_LABELS.length}
        </span>
        <span className="text-sm text-slate-500">{STEP_LABELS[currentStep]}</span>
      </div>
      <Progress value={progress} />
      <div className="hidden sm:flex justify-between">
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => onStepClick?.(i)}
            disabled={i > currentStep}
            className={cn(
              'text-xs transition-colors',
              i === currentStep ? 'text-navy font-semibold' :
              i < currentStep ? 'text-gold cursor-pointer hover:text-gold-600' :
              'text-slate-300 cursor-not-allowed'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
