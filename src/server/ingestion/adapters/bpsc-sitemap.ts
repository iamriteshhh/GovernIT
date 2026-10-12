import { sha256 } from "../html";
import { AdapterContext, AdapterResult, ParsedNotice, ParseError, SourceAdapter } from "../types";

/**
 * Bihar Public Service Commission — notification sitemap (Yoast XML sitemaps on bpsc.bihar.gov.in).
 * Checked 2026-10-12: robots.txt allows all and advertises the sitemap; responses carry ETag and
 * Last-Modified. The notification pages expose no machine-readable title or dates, so this adapter
 * is a CHANGE SIGNAL only: every new or updated official notice goes to admin review. It never
 * creates or edits opportunity data by itself.
 */

export function parseSitemapIndex(xml: string): string[] {
  if (!/<sitemapindex\b/i.test(xml)) throw new ParseError("BPSC: not a sitemap index");
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
}

/** Highest-numbered notification sitemap holds the most recently modified notices. */
export function latestNotificationSitemap(locs: string[]): string | null {
  const ranked = locs
    .map((loc) => ({ loc, m: /bsc_notification-sitemap(\d*)\.xml$/i.exec(loc) }))
    .filter((x) => x.m)
    .map((x) => ({ loc: x.loc, n: x.m![1] ? Number(x.m![1]) : 1 }))
    .sort((a, b) => b.n - a.n);
  return ranked[0]?.loc ?? null;
}

export function parseNotificationSitemap(xml: string): ParsedNotice[] {
  if (!/<urlset\b/i.test(xml)) throw new ParseError("BPSC: not a urlset sitemap");
  const notices: ParsedNotice[] = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
    const loc = /<loc>\s*([^<\s]+)\s*<\/loc>/i.exec(m[1])?.[1];
    const lastmod = /<lastmod>\s*([^<\s]+)\s*<\/lastmod>/i.exec(m[1])?.[1] ?? null;
    const id = loc ? /\/notifications\/(\d+)\/?$/.exec(loc)?.[1] : undefined;
    if (!loc || !id) continue;
    const updated = lastmod && !isNaN(Date.parse(lastmod)) ? new Date(lastmod).toISOString() : null;
    notices.push({
      externalId: id,
      title: `BPSC official notice #${id}`,
      evidenceUrl: loc,
      noticeUrl: loc,
      applyUrl: null,
      opensAt: null,
      closesAt: null,
      examDate: null,
      updatedAt: updated,
      lifecycleSignal: null,
      ambiguous: updated ? [] : ["updatedAt"],
    });
  }
  return notices;
}

export const bpscSitemapAdapter: SourceAdapter = {
  id: "bpsc-notification-sitemap",
  version: "1.0.0",
  mode: "signals",
  hosts: ["bpsc.bihar.gov.in"],
  stateCode: "BR",

  async run(ctx: AdapterContext): Promise<AdapterResult> {
    // The index has no useful validators of its own; the page sitemap below is fetched conditionally.
    const index = await ctx.fetch(ctx.source.url, { etag: null, lastModified: null });
    const latest = latestNotificationSitemap(parseSitemapIndex(index.body));
    if (!latest) throw new ParseError("BPSC: notification sitemap not listed in index");

    const page = await ctx.fetch(latest);
    const http = { status: page.status, finalUrl: page.finalUrl, etag: page.etag, lastModified: page.lastModified };
    if (page.notModified) return { notModified: true, http, contentHash: null, notices: [] };

    // Newest 30 by modification time; older ones are history the feed does not need.
    const notices = parseNotificationSitemap(page.body)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
      .slice(0, 30);
    if (notices.length === 0) throw new ParseError("BPSC: notification sitemap parsed to zero notices");
    return { notModified: false, http, contentHash: sha256(page.body), notices };
  },
};
