import { cn } from "@/lib/utils";

type StatusType = "verified" | "warning" | "flagged" | "pending" | "active" | "completed" | "review";

const statusStyles: Record<StatusType, string> = {
  verified: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  flagged: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  active: "bg-blue-50 text-[#1E3A5F] dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  review: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

const statusDots: Record<StatusType, string> = {
  verified: "bg-emerald-500",
  warning: "bg-amber-500",
  flagged: "bg-red-500",
  pending: "bg-slate-400",
  active: "bg-[#1E3A5F]",
  completed: "bg-emerald-500",
  review: "bg-cyan-500",
};

export default function StatusBadge({ status, label }: { status: StatusType; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide",
        statusStyles[status]
      )}
      data-testid={`status-${status}`}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", statusDots[status])} />
      {label}
    </span>
  );
}
