import { StatusEvaluation } from "@/domain/status";
import { CheckCircle2, AlertTriangle, XCircle, Info, Calendar } from "lucide-react";

interface StatusBadgeProps {
  evaluation: StatusEvaluation;
  size?: "sm" | "md";
}

export function StatusBadge({ evaluation, size = "md" }: StatusBadgeProps) {
  const { status, statusLabel } = evaluation;

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  let Icon = Info;

  switch (status) {
    case "APPLICATION_OPEN":
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      Icon = CheckCircle2;
      break;
    case "CLOSING_SOON":
      // Calm semantic amber without distracting animations
      colorClasses = "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800";
      Icon = AlertTriangle;
      break;
    case "CLOSED":
    case "EXAM_COMPLETED":
      colorClasses = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
      Icon = XCircle;
      break;
    case "EXAM_UPCOMING":
      colorClasses = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
      Icon = Calendar;
      break;
    case "RESULT_ANNOUNCED":
      colorClasses = "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
      Icon = CheckCircle2;
      break;
    case "NOT_ANNOUNCED":
    default:
      colorClasses = "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
      Icon = Info;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${sizeClasses} ${colorClasses}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>{statusLabel}</span>
    </span>
  );
}
