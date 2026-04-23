'use client';

import { ChevronLeft, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  // Overrides backPath when provided. Use for pages that should return to
  // wherever the user came from (e.g. /terms, /privacy opened mid-flow).
  onBack?: () => void;
  showMenu?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backPath, onBack, showMenu = false, rightAction }: PageHeaderProps) {
  const router = useRouter();
  const showBack = !!onBack || !!backPath;
  const handleBack = () => {
    if (onBack) onBack();
    else if (backPath) router.push(backPath);
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors"
              data-testid="back-button"
            >
              <ChevronLeft size={22} className="text-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight" data-testid="page-title">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
          {showMenu && (
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="menu-button">
              <MoreVertical size={18} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
