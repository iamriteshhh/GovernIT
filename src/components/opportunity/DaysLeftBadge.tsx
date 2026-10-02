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
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-900">
        <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
        Closes Today
      </span>
    );
  }

  if (daysLeft <= 7 || isUrgent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800">
        <Clock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
        {daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
      {daysLeft} days left
    </span>
  );
}
