'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Props {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  className = '',
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={`mb-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-muted/20 ${open ? 'border-b border-border/30' : ''}`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-[#1E3A5F] shrink-0" />}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1E3A5F]">
            {title}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '9999px' : '0px' }}
      >
        <div className="p-4">{children}</div>
      </div>
    </Card>
  );
}
