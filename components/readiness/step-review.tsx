'use client';

import React from 'react';
import { useIntakeStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { BUDGET_MAX } from '@/lib/constants';

interface StepReviewProps {
  onEditStep: (step: number) => void;
}

export function StepReview({ onEditStep }: StepReviewProps) {
  const store = useIntakeStore();

  const sections = [
    { label: 'Home Type', value: store.homeType || 'Not selected', step: 0 },
    { label: 'Renovation Scope', value: store.renovationScope.length > 0 ? store.renovationScope.join(', ') : 'None selected', step: 1 },
    {
      label: 'Budget',
      value: store.budgetUndecided
        ? 'Still deciding'
        : `${formatCurrency(store.budgetRange.min)} – ${store.budgetRange.max >= BUDGET_MAX ? '$500K+' : formatCurrency(store.budgetRange.max)}`,
      step: 2,
    },
    { label: 'Timeline', value: `Start: ${store.timeline.start || 'Not set'} | Completion: ${store.timeline.completion || 'Not set'}`, step: 3 },
    { label: 'Location', value: [store.propertyAddress, store.zipCode].filter(Boolean).join(', ') || 'Not provided', step: 4 },
    { label: 'Contact', value: `${store.contactName} (${store.contactEmail})${store.contactPhone ? `, ${store.contactPhone}` : ''}`, step: 5 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Review your information</h2>
        <p className="mt-1 text-sm text-slate-500">Make sure everything looks correct before generating your report.</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.label} className="flex justify-between items-start p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">{section.label}</p>
              <p className="text-sm text-slate-500 mt-1">{section.value}</p>
            </div>
            <button
              onClick={() => onEditStep(section.step)}
              className="text-sm text-gold hover:text-gold-600 font-medium shrink-0 ml-4"
            >
              Edit
            </button>
          </div>
        ))}

        {store.additionalNotes && (
          <div className="flex justify-between items-start p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Additional Notes</p>
              <p className="text-sm text-slate-500 mt-1">{store.additionalNotes}</p>
            </div>
            <button
              onClick={() => onEditStep(1)}
              className="text-sm text-gold hover:text-gold-600 font-medium shrink-0 ml-4"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
