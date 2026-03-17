'use client';

import React from 'react';
import { ChefHat, Bath, Hammer, PlusSquare, Zap, Droplets, Wind, Grid3X3, Paintbrush, Columns3, DoorOpen, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntakeStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';

const iconMap: Record<string, React.ElementType> = {
  ChefHat, Bath, Hammer, PlusSquare, Zap, Droplets, Wind, Grid3x3: Grid3X3, Paintbrush, Columns3, DoorOpen, Home,
};

const SCOPE_CATEGORIES = [
  { value: 'kitchen', label: 'Kitchen', icon: 'ChefHat' },
  { value: 'bathroom', label: 'Bathroom', icon: 'Bath' },
  { value: 'full_gut', label: 'Full Gut Renovation', icon: 'Hammer' },
  { value: 'addition', label: 'Addition/Extension', icon: 'PlusSquare' },
  { value: 'electrical', label: 'Electrical', icon: 'Zap' },
  { value: 'plumbing', label: 'Plumbing', icon: 'Droplets' },
  { value: 'hvac', label: 'HVAC', icon: 'Wind' },
  { value: 'flooring', label: 'Flooring', icon: 'Grid3x3' },
  { value: 'painting', label: 'Painting', icon: 'Paintbrush' },
  { value: 'structural', label: 'Structural', icon: 'Columns3' },
  { value: 'windows_doors', label: 'Windows/Doors', icon: 'DoorOpen' },
  { value: 'roofing', label: 'Roofing', icon: 'Home' },
];

export function StepScope() {
  const { renovationScope, toggleScope, additionalNotes, setAdditionalNotes } = useIntakeStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">What are you renovating?</h2>
        <p className="mt-1 text-sm text-slate-500">Select all areas that apply. You can choose multiple.</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {SCOPE_CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon] || Home;
          const isSelected = renovationScope.includes(cat.value);

          return (
            <button
              key={cat.value}
              onClick={() => toggleScope(cat.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                isSelected
                  ? 'border-gold bg-gold-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <Icon className={cn('h-6 w-6', isSelected ? 'text-gold' : 'text-slate-400')} />
              <span className={cn('text-xs font-medium', isSelected ? 'text-navy' : 'text-slate-600')}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Anything else we should know about your project?
        </label>
        <Textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Describe your renovation goals, special requirements, or concerns..."
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-slate-400 text-right">{additionalNotes.length}/500</p>
      </div>
    </div>
  );
}
