import {
  evaluateApplicationStatus,
  evaluateExamScheduleStatus,
  LifecycleState,
  StatusEvaluation,
  OpportunityStatus,
} from "@/domain/status";
import { evaluateFreshness, FreshnessEvaluation } from "@/domain/freshness";

type Period = { opensAt: Date | null; closesAt: Date | null; isRolling?: boolean } | null | undefined;

export function computeExamStatus(exam: {
  applicationPeriod?: Period;
  examDate?: Date | null;
  resultStatus?: string | null;
  lifecycle?: LifecycleState;
}, now: Date = new Date()): {
  applicationStatus: StatusEvaluation;
  examScheduleStatus: StatusEvaluation;
} {
  const applicationStatus = evaluateApplicationStatus(
    {
      opensAt: exam.applicationPeriod?.opensAt,
      closesAt: exam.applicationPeriod?.closesAt,
      isRolling: exam.applicationPeriod?.isRolling,
      lifecycle: exam.lifecycle,
    },
    now
  );

  const examScheduleStatus = evaluateExamScheduleStatus(exam.examDate, exam.resultStatus, now, exam.lifecycle);

  return { applicationStatus, examScheduleStatus };
}

/** Scheme deadline comes ONLY from ApplicationPeriod (canonical rule). */
export function computeSchemeStatus(scheme: {
  applicationPeriod?: Period;
  lifecycle?: LifecycleState;
}, now: Date = new Date()): StatusEvaluation {
  return evaluateApplicationStatus(
    {
      opensAt: scheme.applicationPeriod?.opensAt,
      closesAt: scheme.applicationPeriod?.closesAt,
      isRolling: scheme.applicationPeriod?.isRolling,
      lifecycle: scheme.lifecycle,
    },
    now
  );
}

export function computeFreshness(record: {
  verifications: Array<{ verifiedAt: Date }>;
  monitoredSource?: { consecutiveFailures: number; staleAfterHours: number } | null;
  changeCandidates?: Array<unknown>;
}, kind: "exam" | "scheme", now: Date = new Date()): FreshnessEvaluation {
  return evaluateFreshness(
    {
      kind,
      lastVerifiedAt: record.verifications[0]?.verifiedAt ?? null,
      sourceFailing: (record.monitoredSource?.consecutiveFailures ?? 0) > 0,
      reviewPending: (record.changeCandidates?.length ?? 0) > 0,
      staleAfterHours: record.monitoredSource?.staleAfterHours ?? null,
    },
    now
  );
}

export { evaluateApplicationStatus, evaluateExamScheduleStatus };
export type { StatusEvaluation, OpportunityStatus };
