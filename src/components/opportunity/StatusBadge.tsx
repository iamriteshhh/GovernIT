import { StatusEvaluation } from "@/domain/status";
import { AlertTriangle, Ban, Calendar, CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  evaluation: Pick<StatusEvaluation, "status" | "statusLabel">;
  size?: "sm" | "md";
}

const STYLES = {
  open: { cls: "bg-success-bg text-success border-success-line", Icon: CheckCircle2 },
  urgent: { cls: "bg-urgent-bg text-urgent border-urgent-line", Icon: AlertTriangle },
  upcoming: { cls: "bg-info-bg text-info border-info-line", Icon: Clock },
  exam: { cls: "bg-info-bg text-info border-info-line", Icon: Calendar },
  closed: { cls: "bg-surface-muted text-muted border-line", Icon: XCircle },
  void: { cls: "bg-danger-bg text-danger border-danger-line", Icon: Ban },
  unknown: { cls: "bg-surface-muted text-fg border-line", Icon: HelpCircle },
} as const;

function styleFor(status: StatusEvaluation["status"]) {
  switch (status) {
    case "APPLICATION_OPEN":
    case "RESULT_ANNOUNCED":
      return STYLES.open;
    case "CLOSING_SOON":
      return STYLES.urgent;
    case "UPCOMING":
      return STYLES.upcoming;
    case "EXAM_UPCOMING":
      return STYLES.exam;
    case "CLOSED":
    case "EXAM_COMPLETED":
      return STYLES.closed;
    case "CANCELLED":
    case "WITHDRAWN":
    case "SUPERSEDED":
      return STYLES.void;
    default:
      return STYLES.unknown;
  }
}

/** Status is always icon + text, never colour alone. */
export function StatusBadge({ evaluation, size = "md" }: StatusBadgeProps) {
  const { cls, Icon } = styleFor(evaluation.status);
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-sm" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClasses} ${cls}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{evaluation.statusLabel}</span>
    </span>
  );
}
