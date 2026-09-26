import {
  evaluateApplicationStatus,
  evaluateExamScheduleStatus,
  StatusEvaluation,
  OpportunityStatus,
} from "@/domain/status";

export function computeExamStatus(exam: {
  applicationPeriod?: { opensAt: Date; closesAt: Date | null } | null;
  examDate?: Date | null;
  resultStatus?: string | null;
}, now: Date = new Date()): {
  applicationStatus: StatusEvaluation;
  examScheduleStatus: StatusEvaluation;
} {
  const applicationStatus = evaluateApplicationStatus(
    exam.applicationPeriod?.opensAt,
    exam.applicationPeriod?.closesAt,
    now
  );

  const examScheduleStatus = evaluateExamScheduleStatus(
    exam.examDate,
    exam.resultStatus,
    now
  );

  return { applicationStatus, examScheduleStatus };
}

export function computeSchemeStatus(scheme: {
  deadline?: Date | null;
}, now: Date = new Date()): StatusEvaluation {
  return evaluateApplicationStatus(
    new Date("2020-01-01"), // Schemes are active from initiation
    scheme.deadline,
    now
  );
}

export { evaluateApplicationStatus, evaluateExamScheduleStatus };
export type { StatusEvaluation, OpportunityStatus };
