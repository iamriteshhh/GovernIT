import { schemeRepository, SchemeQueryFilter } from "@/server/repositories/scheme-repository";
import { computeSchemeStatus } from "@/server/services/status-engine";
import { SchemeOpportunity } from "@/domain/scheme";

export const schemeService = {
  async listSchemes(filters: SchemeQueryFilter = {}): Promise<{
    schemes: SchemeOpportunity[];
    total: number;
  }> {
    const rawSchemes = await schemeRepository.findMany(filters);
    const total = await schemeRepository.count(filters);

    const now = new Date();
    const schemes: SchemeOpportunity[] = rawSchemes.map((s) => {
      const status = computeSchemeStatus(s, now);
      const lastVerified = s.verifications[0]?.verifiedAt ?? null;

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        department: {
          id: s.department.id,
          name: s.department.name,
          type: s.department.type,
        },
        whoCanBenefit: s.whoCanBenefit,
        eligibility: s.eligibility,
        benefits: s.benefits,
        requiredDocuments: s.requiredDocuments,
        applicationProcess: s.applicationProcess,
        deadline: s.deadline,
        state: s.state ? { id: s.state.id, name: s.state.name, code: s.state.code } : null,
        officialApplyUrl: s.officialApplyUrl,
        isPublished: s.isPublished,
        isArchived: s.isArchived,
        sources: s.sources.map((src) => ({
          id: src.id,
          url: src.url,
          type: src.type,
          title: src.title,
          retrievedAt: src.retrievedAt,
        })),
        verifications: s.verifications.map((v) => ({
          id: v.id,
          verifiedAt: v.verifiedAt,
          verifiedBy: v.verifiedBy,
          notes: v.notes,
        })),
        categories: s.categories.map((c) => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
        })),
        status,
        lastVerifiedAt: lastVerified,
      };
    });

    return { schemes, total };
  },

  async getSchemeBySlug(slug: string): Promise<SchemeOpportunity | null> {
    const s = await schemeRepository.findBySlug(slug);
    if (!s) return null;

    const status = computeSchemeStatus(s);
    const lastVerified = s.verifications[0]?.verifiedAt ?? null;

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      department: {
        id: s.department.id,
        name: s.department.name,
        type: s.department.type,
      },
      whoCanBenefit: s.whoCanBenefit,
      eligibility: s.eligibility,
      benefits: s.benefits,
      requiredDocuments: s.requiredDocuments,
      applicationProcess: s.applicationProcess,
      deadline: s.deadline,
      state: s.state ? { id: s.state.id, name: s.state.name, code: s.state.code } : null,
      officialApplyUrl: s.officialApplyUrl,
      isPublished: s.isPublished,
      isArchived: s.isArchived,
      sources: s.sources.map((src) => ({
        id: src.id,
        url: src.url,
        type: src.type,
        title: src.title,
        retrievedAt: src.retrievedAt,
      })),
      verifications: s.verifications.map((v) => ({
        id: v.id,
        verifiedAt: v.verifiedAt,
        verifiedBy: v.verifiedBy,
        notes: v.notes,
      })),
      categories: s.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug,
      })),
      status,
      lastVerifiedAt: lastVerified,
    };
  },

  async getClosingSoonSchemes(): Promise<SchemeOpportunity[]> {
    const { schemes } = await this.listSchemes({ limit: 100 });
    return schemes
      .filter((s) => s.status.status === "CLOSING_SOON")
      .sort((a, b) => (a.status.daysLeft ?? 999) - (b.status.daysLeft ?? 999));
  },
};
