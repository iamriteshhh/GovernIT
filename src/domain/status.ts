import { calculateDaysLeftIST, formatDateIST, formatDateTimeIST } from "@/lib/dates";

export type LifecycleState = "ACTIVE" | "CANCELLED" | "WITHDRAWN" | "SUPERSEDED";

export type ApplicationStatus =
  | "NOT_ANNOUNCED"
  | "UPCOMING"
  | "APPLICATION_OPEN"
  | "CLOSING_SOON"
  | "CLOSED"
  | "CANCELLED"
  | "WITHDRAWN"
  | "SUPERSEDED";

export type ExamScheduleStatus =
  | "NOT_ANNOUNCED"
  | "EXAM_UPCOMING"
  | "EXAM_COMPLETED"
  | "RESULT_ANNOUNCED"
  | "CANCELLED";

export type OpportunityStatus = ApplicationStatus | ExamScheduleStatus;

export interface StatusEvaluation {
  status: OpportunityStatus;
  statusLabel: string;
  daysLeft: number | null;
  urgencyLevel: "urgent" | "normal" | "closed" | "info";
  displayText: string;
}

export interface ApplicationWindow {
  opensAt?: Date | string | null;
  closesAt?: Date | string | null;
  /** Officially continuous enrolment with no fixed deadline. */
  isRolling?: boolean;
  lifecycle?: LifecycleState;
}

export const CLOSING_SOON_THRESHOLD_DAYS = 7;

const INACTIVE_LABELS: Record<Exclude<LifecycleState, "ACTIVE">, string> = {
  CANCELLED: "Cancelled",
  WITHDRAWN: "Withdrawn",
  SUPERSEDED: "Superseded",
};

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  return isNaN(d.getTime()) ? null : d;
}

/** Only these statuses mean "a user can submit an application right now". */
export function isApplicationActionable(status: OpportunityStatus): boolean {
  return status === "APPLICATION_OPEN" || status === "CLOSING_SOON";
}

/** Closed / cancelled / withdrawn / superseded: never shown as available or urgent. */
export function isApplicationInactive(status: OpportunityStatus): boolean {
  return status === "CLOSED" || status === "CANCELLED" || status === "WITHDRAWN" || status === "SUPERSEDED";
}

/**
 * Pure calculation of application status. NO I/O.
 * A passed deadline is always CLOSED, whatever any stored field says.
 */
export function evaluateApplicationStatus(window: ApplicationWindow, now: Date = new Date()): StatusEvaluation {
  const lifecycle = window.lifecycle ?? "ACTIVE";
  if (lifecycle !== "ACTIVE") {
    return {
      status: lifecycle,
      statusLabel: INACTIVE_LABELS[lifecycle],
      daysLeft: null,
      urgencyLevel: "closed",
      displayText: `This opportunity was ${INACTIVE_LABELS[lifecycle].toLowerCase()} by the issuing authority`,
    };
  }

  const openDate = toDate(window.opensAt);
  const closeDate = toDate(window.closesAt);

  if (closeDate && now.getTime() >= closeDate.getTime()) {
    return {
      status: "CLOSED",
      statusLabel: "Applications closed",
      daysLeft: null,
      urgencyLevel: "closed",
      displayText: `Applications closed on ${formatDateIST(closeDate)}`,
    };
  }

  if (openDate && now.getTime() < openDate.getTime()) {
    const daysUntilOpen = calculateDaysLeftIST(openDate, now) ?? 0;
    return {
      status: "UPCOMING",
      statusLabel: "Not open yet",
      daysLeft: daysUntilOpen,
      urgencyLevel: "info",
      displayText: daysUntilOpen <= 0
        ? `Opens today (${formatDateTimeIST(openDate)})`
        : daysUntilOpen === 1
        ? "Opens tomorrow"
        : `Opens on ${formatDateIST(openDate)}`,
    };
  }

  if (!closeDate) {
    if (window.isRolling) {
      return {
        status: "APPLICATION_OPEN",
        statusLabel: "Open (no fixed deadline)",
        daysLeft: null,
        urgencyLevel: "normal",
        displayText: "Enrolment is continuous; no fixed last date published",
      };
    }
    if (openDate) {
      return {
        status: "APPLICATION_OPEN",
        statusLabel: "Applications open",
        daysLeft: null,
        urgencyLevel: "normal",
        displayText: "Last date not yet published",
      };
    }
    return {
      status: "NOT_ANNOUNCED",
      statusLabel: "Dates not announced",
      daysLeft: null,
      urgencyLevel: "info",
      displayText: "Application dates not yet announced officially",
    };
  }

  const daysLeft = calculateDaysLeftIST(closeDate, now) ?? 0;

  if (daysLeft <= CLOSING_SOON_THRESHOLD_DAYS) {
    return {
      status: "CLOSING_SOON",
      statusLabel: "Registration closes soon",
      daysLeft,
      urgencyLevel: "urgent",
      displayText: daysLeft === 0
        ? `Last day: closes ${formatDateTimeIST(closeDate)}`
        : daysLeft === 1
        ? "1 day left to apply"
        : `${daysLeft} days left to apply`,
    };
  }

  return {
    status: "APPLICATION_OPEN",
    statusLabel: "Applications open",
    daysLeft,
    urgencyLevel: "normal",
    displayText: `${daysLeft} days left to apply`,
  };
}

/**
 * Pure calculation function for exam schedule status.
 */
export function evaluateExamScheduleStatus(
  examDate: Date | string | null | undefined,
  resultStatus: string | null | undefined,
  now: Date = new Date(),
  lifecycle: LifecycleState = "ACTIVE"
): StatusEvaluation {
  if (lifecycle === "CANCELLED" || lifecycle === "WITHDRAWN") {
    return {
      status: "CANCELLED",
      statusLabel: "Exam cancelled",
      daysLeft: null,
      urgencyLevel: "closed",
      displayText: "This exam will not be held as notified",
    };
  }

  if (resultStatus && /result\s*declared|announced/i.test(resultStatus)) {
    return {
      status: "RESULT_ANNOUNCED",
      statusLabel: "Result declared",
      daysLeft: null,
      urgencyLevel: "info",
      displayText: resultStatus,
    };
  }

  const date = toDate(examDate);
  if (!date) {
    return {
      status: "NOT_ANNOUNCED",
      statusLabel: "Exam date not announced",
      daysLeft: null,
      urgencyLevel: "info",
      displayText: "Exam date to be announced officially",
    };
  }

  const daysLeft = calculateDaysLeftIST(date, now) ?? 0;

  if (daysLeft < 0) {
    return {
      status: "EXAM_COMPLETED",
      statusLabel: "Exam held",
      daysLeft: null,
      urgencyLevel: "closed",
      displayText: `Exam was held on ${formatDateIST(date)}`,
    };
  }

  return {
    status: "EXAM_UPCOMING",
    statusLabel: "Exam upcoming",
    daysLeft,
    urgencyLevel: daysLeft <= 14 ? "urgent" : "normal",
    displayText: daysLeft === 0
      ? "Exam is today"
      : daysLeft === 1
      ? "Exam tomorrow"
      : `Exam in ${daysLeft} days`,
  };
}

/** Scheme/programme end is a different fact from the application deadline. */
export function describeProgramEnd(programEndsAt: Date | string | null | undefined, now: Date = new Date()): string | null {
  const d = toDate(programEndsAt);
  if (!d) return null;
  return d.getTime() <= now.getTime()
    ? `Programme ended on ${formatDateIST(d)}`
    : `Programme ending on ${formatDateIST(d)}`;
}
