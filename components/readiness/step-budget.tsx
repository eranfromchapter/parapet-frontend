'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { useIntakeStore } from '@/lib/store';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { BUDGET_MIN, BUDGET_MAX, BUDGET_TICKS } from '@/lib/constants';

export function StepBudget() {
  const { budgetRange, setBudgetRange, budgetUndecided, setBudgetUndecided } = useIntakeStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">What&apos;s your renovation budget?</h2>
        <p className="mt-1 text-sm text-slate-500">This helps us calibrate cost estimates and contractor recommendations.</p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="undecided"
          checked={budgetUndecided}
          onCheckedChange={(checked) => setBudgetUndecided(checked as boolean)}
        />
        <label htmlFor="undecided" className="text-sm text-slate-600 cursor-pointer">
          I&apos;m still figuring out my budget
        </label>
      </div>

      {!budgetUndecided && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-navy">
              {formatCurrency(budgetRange.min)} &ndash; {budgetRange.max >= BUDGET_MAX ? '$500K+' : formatCurrency(budgetRange.max)}
            </p>
          </div>

          <div className="px-2">
            <Slider
              value={[budgetRange.min, budgetRange.max]}
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={5000}
              onValueChange={([min, max]) => setBudgetRange({ min, max })}
            />
            <div className="flex justify-between mt-3">
              {BUDGET_TICKS.map((tick) => (
                <span key={tick} className="text-xs text-slate-400">
                  {tick >= 500000 ? '$500K+' : `$${tick / 1000}K`}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <strong>Tip:</strong> Kitchen renovations in your area typically range from $45K&ndash;$120K.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-slate-400">
        <Shield className="h-4 w-4 mt-0.5 shrink-0" />
        <p>Your budget is private and confidential. We will never share it with contractors, vendors, or any third party.</p>
      </div>
    </div>
  );
}
