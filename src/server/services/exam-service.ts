import { examRepository, ExamQueryFilter, ExamRecord } from "@/server/repositories/exam-repository";
import { computeExamStatus, computeFreshness } from "@/server/services/status-engine";
import { loadLinkHealth, mapCategory, mapSource, mapVerification, noticeUrlOf } from "./opportunity-helpers";
import { ExamOpportunity } from "@/domain/exam";
import { LinkHealth } from "@/domain/links";

export function toExamOpportunity(e: ExamRecord, linkHealth: Map<string, LinkHealth>, now: Date = new Date()): ExamOpportunity {
  const { applicationStatus, examScheduleStatus } = computeExamStatus(e, now);
  const freshness = computeFreshness(e, "exam", now);

  return {
    kind: "exam",
    id: e.id,
    name: e.name,
    slug: e.slug,
    conductingBody: {
      id: e.conductingBody.id,
      name: e.conductingBody.name,
      type: e.conductingBody.type,
    },
    department: e.department,
    educationEligibility: e.educationEligibility,
    ageEligibility: e.ageEligibility,
    state: e.state ? { id: e.state.id, name: e.state.name, code: e.state.code } : null,
    examDate: e.examDate,
    admitCardDate: e.admitCardDate,
    resultDate: e.resultDate,
    resultStatus: e.resultStatus,
    applicationFee: e.applicationFee,
    vacancyCount: e.vacancyCount,
    officialApplyUrl: e.officialApplyUrl,
    applyLinkKind: e.applyLinkKind,
    noticeUrl: noticeUrlOf(e.sources),
    lifecycle: e.lifecycle,
    lifecycleNote: e.lifecycleNote,
    isPublished: e.isPublished,
    isArchived: e.isArchived,
    applicationPeriod: e.applicationPeriod
      ? {
          opensAt: e.applicationPeriod.opensAt,
          closesAt: e.applicationPeriod.closesAt,
          isRolling: e.applicationPeriod.isRolling,
        }
      : null,
    sources: e.sources.map(mapSource),
    verifications: e.verifications.map(mapVerification),
    categories: e.categories.map(mapCategory),
    applicationStatus,
    examScheduleStatus,
    freshness,
    linkHealth: linkHealth.get(e.officialApplyUrl) ?? null,
    lastVerifiedAt: freshness.lastVerifiedAt,
  };
}

async function mapAll(records: ExamRecord[]): Promise<ExamOpportunity[]> {
  const health = await loadLinkHealth(records.map((r) => r.officialApplyUrl));
  const now = new Date();
  return records.map((r) => toExamOpportunity(r, health, now));
}

export const examService = {
  async listExams(filters: ExamQueryFilter = {}): Promise<{
    exams: ExamOpportunity[];
    total: number;
  }> {
    const [rawExams, total] = await Promise.all([examRepository.findMany(filters), examRepository.count(filters)]);
    return { exams: await mapAll(rawExams), total };
  },

  async getExamBySlug(slug: string): Promise<ExamOpportunity | null> {
    const e = await examRepository.findBySlug(slug);
    if (!e || !e.isPublished) return null;
    const [exam] = await mapAll([e]);
    return exam;
  },

  /** Every published, non-archived exam (bounded) for deadline-first views. */
  async listActiveCandidates(): Promise<ExamOpportunity[]> {
    const { exams } = await this.listExams({ limit: 500 });
    return exams;
  },

  async getUpcomingExams(): Promise<ExamOpportunity[]> {
    const exams = await this.listActiveCandidates();
    return exams
      .filter((e) => e.examScheduleStatus.status === "EXAM_UPCOMING")
      .sort((a, b) => (a.examScheduleStatus.daysLeft ?? 999) - (b.examScheduleStatus.daysLeft ?? 999));
  },
};
