import { db } from "@/lib/db";
import { LinkHealth } from "@/domain/links";

/** The official notification/guideline URL, kept distinct from the apply URL. */
export function noticeUrlOf(sources: Array<{ url: string; type: string }>): string | null {
  return (
    sources.find((s) => s.type === "OFFICIAL_NOTIFICATION")?.url ??
    sources.find((s) => s.type === "OFFICIAL_GUIDELINE")?.url ??
    null
  );
}

/** Latest conservative link-check result per URL (one query for a whole list). */
export async function loadLinkHealth(urls: string[]): Promise<Map<string, LinkHealth>> {
  const unique = [...new Set(urls)];
  if (unique.length === 0) return new Map();
  const rows = await db.linkCheck.findMany({ where: { url: { in: unique } } });
  return new Map(
    rows.map((r) => [
      r.url,
      { result: r.lastResult, consecutiveFailures: r.consecutiveFailures, lastCheckedAt: r.lastCheckedAt },
    ])
  );
}

export const mapSource = (s: { id: string; url: string; type: string; title: string | null; retrievedAt: Date }) => ({
  id: s.id,
  url: s.url,
  type: s.type,
  title: s.title,
  retrievedAt: s.retrievedAt,
});

export const mapVerification = (v: { id: string; verifiedAt: Date; verifiedBy: string; notes: string | null }) => ({
  id: v.id,
  verifiedAt: v.verifiedAt,
  verifiedBy: v.verifiedBy,
  notes: v.notes,
});

export const mapCategory = (c: { category: { id: string; name: string; slug: string } }) => ({
  id: c.category.id,
  name: c.category.name,
  slug: c.category.slug,
});
