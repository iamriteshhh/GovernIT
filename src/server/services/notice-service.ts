import { db } from "@/lib/db";

export interface NoticeItem {
  id: string;
  title: string;
  url: string;
  publishedOn: Date | null;
  firstSeenAt: Date;
  source: { key: string; name: string; organization: string };
}

/** Latest official notices, newest first (stated date when the source gives one, else first seen). */
export async function listOfficialNotices(opts: { sourceKey?: string; limit?: number } = {}): Promise<NoticeItem[]> {
  const rows = await db.officialNotice.findMany({
    where: opts.sourceKey ? { source: { key: opts.sourceKey } } : undefined,
    include: { source: { select: { key: true, name: true, organization: true } } },
    orderBy: [{ firstSeenAt: "desc" }],
    take: 500,
  });
  const when = (n: { publishedOn: Date | null; firstSeenAt: Date }) => (n.publishedOn ?? n.firstSeenAt).getTime();
  return rows
    .sort((a, b) => when(b) - when(a))
    .slice(0, opts.limit ?? 100)
    .map((r) => ({ id: r.id, title: r.title, url: r.url, publishedOn: r.publishedOn, firstSeenAt: r.firstSeenAt, source: r.source }));
}

export async function listNoticeSources() {
  return db.monitoredSource.findMany({
    where: { enabled: true, opportunityType: "notice" },
    select: { key: true, name: true, organization: true, lastSuccessAt: true },
    orderBy: { name: "asc" },
  });
}
