import { Clock, AlertCircle } from "lucide-react";

interface DaysLeftBadgeProps {
  daysLeft: number | null;
  isUrgent?: boolean;
}

export function DaysLeftBadge({ daysLeft, isUrgent }: DaysLeftBadgeProps) {
  if (daysLeft === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <Clock className="h-3 w-3" />
        No deadline
      </span>
    );
  }

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        Closed
      </span>
    );
  }

  if (daysLeft === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800 ring-1 ring-inset ring-red-600/30 animate-pulse dark:bg-red-950/70 dark:text-red-200">
        <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        Closes Today!
      </span>
    );
  }

  if (daysLeft <= 7 || isUrgent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 ring-1 ring-inset ring-amber-600/30 dark:bg-amber-950/70 dark:text-amber-200">
        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        {daysLeft === 1 ? "1 day left!" : `${daysLeft} days left`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300">
      <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      {daysLeft} days left
    </span>
  );
}
