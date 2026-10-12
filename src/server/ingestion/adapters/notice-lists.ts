import { absoluteUrl, decodeEntities, indianDateToIso, sha256, textOf } from "../html";
import { parseISTDate } from "@/lib/dates";
import { AdapterContext, AdapterResult, ParsedNotice, ParseError, SourceAdapter } from "../types";

/**
 * Official "latest notices" lists from state public service commissions.
 * These are CHANGE SIGNALS: we copy the official title, link and stated date, nothing else.
 * Each source has its own parser; they only share the fetch/limit plumbing below.
 * All four were checked on 2026-10-12: public HTML, robots.txt absent or allowing, no login/CAPTCHA.
 */

/** Newest notices kept per run (lists are ordered newest first on all four sites). */
export const MAX_NOTICES = 40;

function notice(title: string, href: string, pageUrl: string, date: string | null): ParsedNotice | null {
  const url = absoluteUrl(decodeEntities(href), pageUrl);
  const clean = title.replace(/\s+/g, " ").trim();
  if (!url || clean.length < 8) return null;
  const published = date ? parseISTDate(date, "start")?.toISOString() ?? null : null;
  return {
    externalId: sha256(url).slice(0, 32),
    title: clean.slice(0, 480),
    evidenceUrl: pageUrl,
    noticeUrl: url,
    applyUrl: null,
    opensAt: null,
    closesAt: null,
    examDate: null,
    updatedAt: published,
    lifecycleSignal: null,
    ambiguous: [],
  };
}

const dedupe = (items: Array<ParsedNotice | null>) => {
  const seen = new Set<string>();
  return items.filter((n): n is ParsedNotice => !!n && !seen.has(n.externalId) && !!seen.add(n.externalId)).slice(0, MAX_NOTICES);
};

const dmy = (s: string | undefined) => {
  const m = s ? /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(s) : null;
  return m ? indianDateToIso(m[1], m[2], m[3]) : null;
};

/** RPSC home page, "News and Events": <a href=...><span class='badge'>DD/MM/YYYY</span> Title</a> */
export function parseRpsc(html: string, pageUrl: string): ParsedNotice[] {
  const start = html.search(/News and Events/i);
  if (start < 0) throw new ParseError("RPSC: 'News and Events' block not found");
  const block = html.slice(start, start + 60_000);
  return dedupe(
    [...block.matchAll(/<a\b[^>]*href\s*=\s*'([^']+)'[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => {
      const date = /<span class='badge'>([^<]+)<\/span>/i.exec(m[2])?.[1];
      return date ? notice(textOf(m[2].replace(/<span class='badge'>[^<]*<\/span>/i, "")), m[1], pageUrl, dmy(date)) : null;
    })
  );
}

/** PPSC home page notice tabs: <li class="list-group-item-simpletab"><a title="... UPLOADED ON DD-MM-YYYY" href=...> */
export function parsePpsc(html: string, pageUrl: string): ParsedNotice[] {
  const items = [...html.matchAll(/<li class="list-group-item-simpletab">([\s\S]*?)<\/li>/gi)];
  if (items.length === 0) throw new ParseError("PPSC: notice list not found");
  return dedupe(
    items.map((m) => {
      const a = /<a\b[^>]*title="([^"]*)"[^>]*href="([^"]+)"/i.exec(m[1]);
      const uploaded = a ? /uploaded on\s*(\d{1,2}-\d{1,2}-\d{4})/i.exec(a[1])?.[1] : undefined;
      if (!a || !uploaded) return null; // undated tabs are rules/forms, not news
      return notice(decodeEntities(a[1]).replace(/\s*uploaded on\s*\d{1,2}-\d{1,2}-\d{4}\s*$/i, ""), a[2], pageUrl, dmy(uploaded));
    })
  );
}

/** Kerala PSC "PSC Examination updates" page: PDF links inside the page body. */
export function parseKeralaPsc(html: string, pageUrl: string): ParsedNotice[] {
  const start = html.indexOf("field--name-body", Math.max(0, html.indexOf("<article")));
  if (start < 0) throw new ParseError("Kerala PSC: page body not found");
  const block = html.slice(start, html.indexOf("</article>", start) > 0 ? html.indexOf("</article>", start) : start + 80_000);
  return dedupe(
    [...block.matchAll(/<a\b[^>]*href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => notice(textOf(m[2]), m[1], pageUrl, null))
  );
}

/** JPSC "Notice / Press Release" page: data/*.pdf links with "uploaded date: DD-MM-YYYY". */
export function parseJpsc(html: string, pageUrl: string): ParsedNotice[] {
  const items = [...html.matchAll(/<a\b[^>]*href\s*=\s*["'](data\/[^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: m[1], title: textOf(m[2]) }))
    .filter((x) => !/annual report|calendar|faq/i.test(x.title));
  if (items.length === 0) throw new ParseError("JPSC: notice links not found");
  return dedupe(
    items.map((x) => {
      const date = /uploaded\s*date\s*:?-?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i.exec(x.title)?.[1];
      return notice(x.title.replace(/\s*uploaded\s*date\s*:?-?\s*\d{1,2}[./-]\d{1,2}[./-]\d{4}\s*$/i, ""), x.href, pageUrl, dmy(date));
    })
  );
}

function listAdapter(id: string, host: string, stateCode: string, parse: (html: string, pageUrl: string) => ParsedNotice[]): SourceAdapter {
  return {
    id,
    version: "1.0.0",
    mode: "signals",
    hosts: [host],
    stateCode,
    async run(ctx: AdapterContext): Promise<AdapterResult> {
      const page = await ctx.fetch(ctx.source.url);
      const http = { status: page.status, finalUrl: page.finalUrl, etag: page.etag, lastModified: page.lastModified };
      if (page.notModified) return { notModified: true, http, contentHash: null, notices: [] };
      const notices = parse(page.body, page.finalUrl);
      if (notices.length === 0) throw new ParseError(`${id}: parsed zero notices (layout may have changed)`);
      return { notModified: false, http, contentHash: sha256(JSON.stringify(notices)), notices };
    },
  };
}

export const rpscNewsAdapter = listAdapter("rpsc-news", "rpsc.rajasthan.gov.in", "RJ", parseRpsc);
export const ppscNoticesAdapter = listAdapter("ppsc-notices", "ppsc.gov.in", "PB", parsePpsc);
export const keralaPscUpdatesAdapter = listAdapter("keralapsc-exam-updates", "keralapsc.gov.in", "KL", parseKeralaPsc);
export const jpscNoticesAdapter = listAdapter("jpsc-notices", "jpsc.gov.in", "JH", parseJpsc);
