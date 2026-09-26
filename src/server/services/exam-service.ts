import { examRepository, ExamQueryFilter } from "@/server/repositories/exam-repository";
import { computeExamStatus } from "@/server/services/status-engine";
import { ExamOpportunity } from "@/domain/exam";

export const examService = {
  async listExams(filters: ExamQueryFilter = {}): Promise<{
    exams: ExamOpportunity[];
    total: number;
  }> {
    const rawExams = await examRepository.findMany(filters);
    const total = await examRepository.count(filters);

    const now = new Date();
    const exams: ExamOpportunity[] = rawExams.map((e) => {
      const { applicationStatus, examScheduleStatus } = computeExamStatus(e, now);
      const lastVerified = e.verifications[0]?.verifiedAt ?? null;

      return {
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
        isPublished: e.isPublished,
        isArchived: e.isArchived,
        applicationPeriod: e.applicationPeriod
          ? { opensAt: e.applicationPeriod.opensAt, closesAt: e.applicationPeriod.closesAt }
          : null,
        sources: e.sources.map((s) => ({
          id: s.id,
          url: s.url,
          type: s.type,
          title: s.title,
          retrievedAt: s.retrievedAt,
        })),
        verifications: e.verifications.map((v) => ({
          id: v.id,
          verifiedAt: v.verifiedAt,
          verifiedBy: v.verifiedBy,
          notes: v.notes,
        })),
        categories: e.categories.map((c) => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
        })),
        applicationStatus,
        examScheduleStatus,
        lastVerifiedAt: lastVerified,
      };
    });

    return { exams, total };
  },

  async getExamBySlug(slug: string): Promise<ExamOpportunity | null> {
    const e = await examRepository.findBySlug(slug);
    if (!e) return null;

    const { applicationStatus, examScheduleStatus } = computeExamStatus(e);
    const lastVerified = e.verifications[0]?.verifiedAt ?? null;

    return {
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
      isPublished: e.isPublished,
      isArchived: e.isArchived,
      applicationPeriod: e.applicationPeriod
        ? { opensAt: e.applicationPeriod.opensAt, closesAt: e.applicationPeriod.closesAt }
        : null,
      sources: e.sources.map((s) => ({
        id: s.id,
        url: s.url,
        type: s.type,
        title: s.title,
        retrievedAt: s.retrievedAt,
      })),
      verifications: e.verifications.map((v) => ({
        id: v.id,
        verifiedAt: v.verifiedAt,
        verifiedBy: v.verifiedBy,
        notes: v.notes,
      })),
      categories: e.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug,
      })),
      applicationStatus,
      examScheduleStatus,
      lastVerifiedAt: lastVerified,
    };
  },

  async getClosingSoonExams(): Promise<ExamOpportunity[]> {
    const { exams } = await this.listExams({ limit: 100 });
    return exams
      .filter((e) => e.applicationStatus.status === "CLOSING_SOON")
      .sort((a, b) => (a.applicationStatus.daysLeft ?? 999) - (b.applicationStatus.daysLeft ?? 999));
  },

  async getUpcomingExams(): Promise<ExamOpportunity[]> {
    const { exams } = await this.listExams({ limit: 100 });
    return exams
      .filter((e) => e.examScheduleStatus.status === "EXAM_UPCOMING")
      .sort((a, b) => (a.examScheduleStatus.daysLeft ?? 999) - (b.examScheduleStatus.daysLeft ?? 999));
  },
};
