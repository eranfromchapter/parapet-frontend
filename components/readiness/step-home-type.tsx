'use client';

import React from 'react';
import { Building, Building2, Landmark, Home, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntakeStore } from '@/lib/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap: Record<string, React.ElementType> = {
  Building, Building2, Landmark, Home,
};

const HOME_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: 'Building' },
  { value: 'condo', label: 'Condo', icon: 'Building2', tooltip: 'Condo boards may require additional approvals' },
  { value: 'coop', label: 'Co-op', icon: 'Landmark', tooltip: 'Co-op boards typically have stricter renovation rules' },
  { value: 'townhouse', label: 'Townhouse', icon: 'Home' },
  { value: 'single_family', label: 'Single-Family House', icon: 'Home' },
];

export function StepHomeType() {
  const { homeType, setHomeType } = useIntakeStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">What type of home are you renovating?</h2>
        <p className="mt-1 text-sm text-slate-500">This helps us tailor your regulatory checklist and cost estimates.</p>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {HOME_TYPES.map((type) => {
            const Icon = iconMap[type.icon] || Home;
            const isSelected = homeType === type.value;

            return (
              <button
                key={type.value}
                onClick={() => setHomeType(type.value)}
                className={cn(
                  'relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                  isSelected
                    ? 'border-gold bg-gold-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                )}
              >
                <Icon className={cn('h-8 w-8', isSelected ? 'text-gold' : 'text-slate-400')} />
                <span className={cn('text-sm font-medium', isSelected ? 'text-navy' : 'text-slate-700')}>
                  {type.label}
                </span>
                {type.tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="absolute top-2 right-2 h-4 w-4 text-slate-300" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{type.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </button>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
