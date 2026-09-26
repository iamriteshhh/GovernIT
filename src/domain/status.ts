import { calculateDaysLeftIST } from "@/lib/dates";

export type OpportunityStatus =
  | "APPLICATION_OPEN"
  | "CLOSING_SOON"
  | "CLOSED"
  | "EXAM_UPCOMING"
  | "EXAM_COMPLETED"
  | "RESULT_ANNOUNCED"
  | "NOT_ANNOUNCED";

export interface StatusEvaluation {
  status: OpportunityStatus;
  statusLabel: string;
  daysLeft: number | null;
  urgencyLevel: "urgent" | "normal" | "closed" | "info";
  displayText: string;
}

export const CLOSING_SOON_THRESHOLD_DAYS = 7;

/**
 * Pure calculation function for application status and days left.
 * NO I/O, no direct database queries.
 */
export function evaluateApplicationStatus(
  opensAt: Date | string | null | undefined,
  closesAt: Date | string | null | undefined,
  now: Date = new Date()
): StatusEvaluation {
  if (!opensAt && !closesAt) {
    return {
      status: "NOT_ANNOUNCED",
      statusLabel: "Dates Not Announced",
      daysLeft: null,
      urgencyLevel: "info",
      displayText: "Application schedule not yet announced",
    };
  }

  const openDate = opensAt ? (typeof opensAt === "string" ? new Date(opensAt) : opensAt) : null;
  const closeDate = closesAt ? (typeof closesAt === "string" ? new Date(closesAt) : closesAt) : null;

  // If application has not opened yet
  if (openDate && openDate.getTime() > now.getTime()) {
    const daysUntilOpen = calculateDaysLeftIST(openDate, now);
    return {
      status: "NOT_ANNOUNCED",
      statusLabel: "Opening Soon",
      daysLeft: daysUntilOpen,
      urgencyLevel: "info",
      displayText: daysUntilOpen !== null && daysUntilOpen <= 1
        ? "Opening tomorrow"
        : `Opens in ${daysUntilOpen} days`,
    };
  }

  // Application has no close date (open-ended scheme)
  if (!closeDate) {
    return {
      status: "APPLICATION_OPEN",
      statusLabel: "Ongoing / Open",
      daysLeft: null,
      urgencyLevel: "normal",
      displayText: "Applications actively open (no deadline)",
    };
  }

  const daysLeft = calculateDaysLeftIST(closeDate, now);

  if (daysLeft === null || daysLeft < 0) {
    return {
      status: "CLOSED",
      statusLabel: "Application Closed",
      daysLeft: 0,
      urgencyLevel: "closed",
      displayText: "Application window has closed",
    };
  }

  if (daysLeft <= CLOSING_SOON_THRESHOLD_DAYS) {
    return {
      status: "CLOSING_SOON",
      statusLabel: "Closing Soon",
      daysLeft,
      urgencyLevel: "urgent",
      displayText: daysLeft === 0
        ? "Closes today!"
        : daysLeft === 1
        ? "1 day left to apply!"
        : `${daysLeft} days left to apply`,
    };
  }

  return {
    status: "APPLICATION_OPEN",
    statusLabel: "Application Open",
    daysLeft,
    urgencyLevel: "normal",
    displayText: `${daysLeft} days remaining`,
  };
}

/**
 * Pure calculation function for exam schedule status.
 */
export function evaluateExamScheduleStatus(
  examDate: Date | string | null | undefined,
  resultStatus: string | null | undefined,
  now: Date = new Date()
): StatusEvaluation {
  if (resultStatus && /result\s*declared|announced/i.test(resultStatus)) {
    return {
      status: "RESULT_ANNOUNCED",
      statusLabel: "Result Declared",
      daysLeft: null,
      urgencyLevel: "info",
      displayText: resultStatus,
    };
  }

  if (!examDate) {
    return {
      status: "NOT_ANNOUNCED",
      statusLabel: "Exam Date TBA",
      daysLeft: null,
      urgencyLevel: "info",
      displayText: "Exam date to be announced officially",
    };
  }

  const daysLeft = calculateDaysLeftIST(examDate, now);

  if (daysLeft === null || daysLeft < 0) {
    return {
      status: "EXAM_COMPLETED",
      statusLabel: "Exam Completed",
      daysLeft: 0,
      urgencyLevel: "closed",
      displayText: "Exam has concluded",
    };
  }

  return {
    status: "EXAM_UPCOMING",
    statusLabel: "Exam Upcoming",
    daysLeft,
    urgencyLevel: daysLeft <= 14 ? "urgent" : "normal",
    displayText: daysLeft === 0
      ? "Exam is today"
      : daysLeft === 1
      ? "Exam tomorrow"
      : `Exam in ${daysLeft} days`,
  };
}
