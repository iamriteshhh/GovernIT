import { schemeRepository, SchemeQueryFilter, SchemeRecord } from "@/server/repositories/scheme-repository";
import { computeFreshness, computeSchemeStatus } from "@/server/services/status-engine";
import { loadLinkHealth, mapCategory, mapSource, mapVerification, noticeUrlOf } from "./opportunity-helpers";
import { SchemeOpportunity } from "@/domain/scheme";
import { LinkHealth } from "@/domain/links";

export function toSchemeOpportunity(s: SchemeRecord, linkHealth: Map<string, LinkHealth>, now: Date = new Date()): SchemeOpportunity {
  const status = computeSchemeStatus(s, now);
  const freshness = computeFreshness(s, "scheme", now);

  return {
    kind: "scheme",
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
    applicationPeriod: s.applicationPeriod
      ? {
          opensAt: s.applicationPeriod.opensAt,
          closesAt: s.applicationPeriod.closesAt,
          isRolling: s.applicationPeriod.isRolling,
        }
      : null,
    programEndsAt: s.programEndsAt,
    state: s.state ? { id: s.state.id, name: s.state.name, code: s.state.code } : null,
    officialApplyUrl: s.officialApplyUrl,
    applyLinkKind: s.applyLinkKind,
    noticeUrl: noticeUrlOf(s.sources),
    lifecycle: s.lifecycle,
    lifecycleNote: s.lifecycleNote,
    isPublished: s.isPublished,
    isArchived: s.isArchived,
    sources: s.sources.map(mapSource),
    verifications: s.verifications.map(mapVerification),
    categories: s.categories.map(mapCategory),
    status,
    applicationStatus: status,
    freshness,
    linkHealth: linkHealth.get(s.officialApplyUrl) ?? null,
    lastVerifiedAt: freshness.lastVerifiedAt,
  };
}

async function mapAll(records: SchemeRecord[]): Promise<SchemeOpportunity[]> {
  const health = await loadLinkHealth(records.map((r) => r.officialApplyUrl));
  const now = new Date();
  return records.map((r) => toSchemeOpportunity(r, health, now));
}

export const schemeService = {
  async listSchemes(filters: SchemeQueryFilter = {}): Promise<{
    schemes: SchemeOpportunity[];
    total: number;
  }> {
    const [rawSchemes, total] = await Promise.all([schemeRepository.findMany(filters), schemeRepository.count(filters)]);
    return { schemes: await mapAll(rawSchemes), total };
  },

  async getSchemeBySlug(slug: string): Promise<SchemeOpportunity | null> {
    const s = await schemeRepository.findBySlug(slug);
    if (!s || !s.isPublished) return null;
    const [scheme] = await mapAll([s]);
    return scheme;
  },

  /** Every published, non-archived scheme (bounded) for deadline-first views. */
  async listActiveCandidates(): Promise<SchemeOpportunity[]> {
    const { schemes } = await this.listSchemes({ limit: 500 });
    return schemes;
  },
};
