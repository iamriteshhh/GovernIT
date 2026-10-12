/**
 * Freshness = how recently an authoritative check confirmed the record.
 * It is a separate axis from lifecycle status: a record can be "open" by its dates
 * while its verification is overdue. Pure functions, no I/O.
 */

export type FreshnessState =
  | "FRESH"
  | "CHECK_DUE"
  | "STALE"
  | "CHECK_FAILED"
  | "REVIEW_REQUIRED"
  | "UNVERIFIED";

export interface FreshnessEvaluation {
  state: FreshnessState;
  label: string;
  /** True only when the record may be presented as confirmed. */
  trustworthy: boolean;
  lastVerifiedAt: Date | null;
}

export interface FreshnessPolicy {
  checkDueHours: number;
  staleHours: number;
}

/**
 * Default thresholds per opportunity type. Exams change fast (dates, corrigenda);
 * scheme guidelines change slowly. A monitored source can override staleHours.
 */
export const FRESHNESS_POLICY: Record<"exam" | "scheme", FreshnessPolicy> = {
  exam: { checkDueHours: 72, staleHours: 24 * 7 },
  scheme: { checkDueHours: 24 * 30, staleHours: 24 * 90 },
};

export interface FreshnessInput {
  kind: "exam" | "scheme";
  lastVerifiedAt: Date | string | null | undefined;
  /** Latest check of the linked monitored source failed. */
  sourceFailing?: boolean;
  /** A change for this record is waiting in the admin review queue. */
  reviewPending?: boolean;
  /** Per-source override of the stale threshold. */
  staleAfterHours?: number | null;
}

const HOUR_MS = 60 * 60 * 1000;

export function evaluateFreshness(input: FreshnessInput, now: Date = new Date()): FreshnessEvaluation {
  const base = FRESHNESS_POLICY[input.kind];
  const staleHours = input.staleAfterHours ?? base.staleHours;
  const checkDueHours = Math.min(base.checkDueHours, staleHours / 2);

  const verified = input.lastVerifiedAt ? new Date(input.lastVerifiedAt) : null;
  const lastVerifiedAt = verified && !isNaN(verified.getTime()) ? verified : null;

  const make = (state: FreshnessState, label: string): FreshnessEvaluation => ({
    state,
    label,
    trustworthy: state === "FRESH" || state === "CHECK_DUE",
    lastVerifiedAt,
  });

  if (!lastVerifiedAt) return make("UNVERIFIED", "Not yet verified");
  if (input.reviewPending) return make("REVIEW_REQUIRED", "Status needs confirmation");

  const ageHours = (now.getTime() - lastVerifiedAt.getTime()) / HOUR_MS;
  if (ageHours > staleHours) return make("STALE", "Verification overdue");
  if (input.sourceFailing) return make("CHECK_FAILED", "Latest official check failed");
  if (ageHours > checkDueHours) return make("CHECK_DUE", "Re-check due");
  return make("FRESH", "Recently verified");
}
