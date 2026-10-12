import { StatusEvaluation } from "./status";
import { FreshnessEvaluation } from "./freshness";

/**
 * Deadline-first grouping for the home page and /closing-soon.
 * 1. verified + closing soon (earliest deadline first)
 * 2. other verified open (earliest deadline first, no-deadline last)
 * 3. upcoming with a confirmed opening date (soonest first)
 * 4. needs confirmation: looks open/upcoming by dates but verification is missing or overdue
 * 5. unknown / not announced
 * Closed, cancelled, withdrawn and superseded are excluded entirely.
 */
export interface Prioritizable {
  applicationStatus: StatusEvaluation;
  freshness: FreshnessEvaluation;
  applicationPeriod: { opensAt: Date | null; closesAt: Date | null } | null;
}

export interface PrioritizedGroups<T> {
  closingSoon: T[];
  open: T[];
  upcoming: T[];
  needsConfirmation: T[];
  unknown: T[];
}

const time = (d: Date | null | undefined) => (d ? new Date(d).getTime() : Number.POSITIVE_INFINITY);

export function prioritizeOpportunities<T extends Prioritizable>(items: T[]): PrioritizedGroups<T> {
  const groups: PrioritizedGroups<T> = { closingSoon: [], open: [], upcoming: [], needsConfirmation: [], unknown: [] };

  for (const item of items) {
    const status = item.applicationStatus.status;
    if (status === "NOT_ANNOUNCED") {
      groups.unknown.push(item);
      continue;
    }
    if (status !== "CLOSING_SOON" && status !== "APPLICATION_OPEN" && status !== "UPCOMING") continue;

    if (!item.freshness.trustworthy) groups.needsConfirmation.push(item);
    else if (status === "CLOSING_SOON") groups.closingSoon.push(item);
    else if (status === "APPLICATION_OPEN") groups.open.push(item);
    else groups.upcoming.push(item);
  }

  const byClose = (a: T, b: T) => time(a.applicationPeriod?.closesAt) - time(b.applicationPeriod?.closesAt);
  const byOpen = (a: T, b: T) => time(a.applicationPeriod?.opensAt) - time(b.applicationPeriod?.opensAt);
  groups.closingSoon.sort(byClose);
  groups.open.sort(byClose);
  groups.upcoming.sort(byOpen);
  groups.needsConfirmation.sort(byClose);
  return groups;
}
