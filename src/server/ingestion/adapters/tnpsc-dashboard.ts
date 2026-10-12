import { parseISTDate } from "@/lib/dates";
import { absoluteUrl, allIndianDates, hrefsOf, indianDateToIso, sha256, textOf } from "../html";
import { AdapterContext, AdapterResult, ParsedNotice, ParseError, SourceAdapter } from "../types";

/**
 * Tamil Nadu Public Service Commission — Exam Dashboard (https://tnpsc.gov.in/web/examdashboard/index.aspx).
 * Checked 2026-10-12: public HTML, no robots.txt restrictions (404), no login/CAPTCHA for the dashboard
 * pages themselves. Notification PDFs sit behind a CAPTCHA modal: we never download them, we only
 * link to them. One list request + one request per listed notification, spaced per host.
 */

const MAX_DETAILS_PER_RUN = 25;

export interface TnpscListEntry {
  notId: string;
  title: string;
  number: string;
  detailUrl: string;
}

const TITLE_NUMBER_RE = /^(?:\d+\.\s*)?(.*?)\s*-\s*(\d{1,3}\/\d{4})\s*$/;

export function parseTnpscList(html: string, baseUrl: string): TnpscListEntry[] {
  const entries: TnpscListEntry[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*href="(index\.aspx\?notid=([0-9a-f-]{36}))"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const notId = m[2].toLowerCase();
    if (seen.has(notId)) continue;
    const text = textOf(m[3]).replace(/\s+/g, " ");
    const tm = TITLE_NUMBER_RE.exec(text);
    if (!tm) continue;
    seen.add(notId);
    entries.push({
      notId,
      title: tm[1].trim(),
      number: tm[2],
      detailUrl: new URL(m[1], baseUrl).toString(),
    });
  }
  return entries;
}

interface DetailRow {
  category: string;
  text: string;
  link: string | null;
}

function rowsOf(html: string, baseUrl: string): DetailRow[] {
  const body = /<tbody>([\s\S]*?)<\/tbody>/i.exec(html)?.[1];
  if (!body) throw new ParseError("TNPSC detail: notification table not found");
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    const href = cells[2] ? hrefsOf(cells[2])[0] : undefined;
    return {
      category: textOf(cells[0] ?? ""),
      text: textOf(cells[1] ?? ""),
      link: href ? absoluteUrl(href, baseUrl) : null,
    };
  });
}

const OPENS_RE = /commencement[^:]*:\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})/i;
const CLOSES_RE =
  /last\s+date[^:]*:\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s*-?\s*(\d{1,2})[.:](\d{2})\s*(A\.?\s*M|P\.?\s*M)\.?)?/i;

function istInstant(isoDate: string, hour = 0, minute = 0): string | null {
  const start = parseISTDate(isoDate, "start");
  return start ? new Date(start.getTime() + (hour * 60 + minute) * 60_000).toISOString() : null;
}

export function parseTnpscDetail(html: string, entry: TnpscListEntry): ParsedNotice {
  const rows = rowsOf(html, entry.detailUrl);
  if (rows.length === 0) throw new ParseError(`TNPSC detail ${entry.number}: no rows`);

  const ambiguous: string[] = [];
  const notification = rows.find((r) => /^notification$/i.test(r.category));
  const examRow = rows.find((r) => /date of examination/i.test(r.category));
  const applyRow = rows.find((r) => /apply online/i.test(r.category));

  let examDate: string | null = null;
  if (examRow) {
    const dates = allIndianDates(examRow.text);
    if (dates.length === 1) examDate = istInstant(dates[0]);
    else ambiguous.push("examDate");
  }

  let opensAt: string | null = null;
  let closesAt: string | null = null;
  let applyUrl: string | null = null;
  if (applyRow) {
    applyUrl = applyRow.link;
    const o = OPENS_RE.exec(applyRow.text);
    const oIso = o ? indianDateToIso(o[1], o[2], o[3]) : null;
    if (oIso) opensAt = istInstant(oIso);
    else if (/commencement/i.test(applyRow.text)) ambiguous.push("opensAt");

    const c = CLOSES_RE.exec(applyRow.text);
    const cIso = c ? indianDateToIso(c[1], c[2], c[3]) : null;
    if (c && cIso) {
      if (c[4]) {
        let h = Number(c[4]) % 12;
        if (/p/i.test(c[6] ?? "")) h += 12;
        const min = Number(c[5]);
        closesAt = min < 60 ? istInstant(cIso, h, min) : null;
        if (!closesAt) ambiguous.push("closesAt");
      } else {
        closesAt = parseISTDate(cIso, "end")!.toISOString();
      }
    } else if (/last\s+date/i.test(applyRow.text)) {
      ambiguous.push("closesAt");
    }
  }

  const signalText = rows.map((r) => `${r.category} ${r.text}`).join("\n");
  const lifecycleSignal = /\bwithdraw(n|al)?\b/i.test(signalText)
    ? "WITHDRAWN"
    : /\bcancel(l?ed|lation)?\b/i.test(signalText)
    ? "CANCELLED"
    : null;

  return {
    externalId: entry.number,
    title: `${entry.title} (Notification ${entry.number})`,
    evidenceUrl: entry.detailUrl,
    noticeUrl: notification?.link ?? null,
    applyUrl,
    opensAt,
    closesAt,
    examDate,
    updatedAt: null,
    lifecycleSignal,
    ambiguous,
  };
}

export const tnpscDashboardAdapter: SourceAdapter = {
  id: "tnpsc-dashboard",
  version: "1.0.0",
  mode: "opportunities",
  hosts: ["tnpsc.gov.in"],
  stateCode: "TN",

  async run(ctx: AdapterContext): Promise<AdapterResult> {
    const list = await ctx.fetch(ctx.source.url);
    const http = { status: list.status, finalUrl: list.finalUrl, etag: list.etag, lastModified: list.lastModified };
    if (list.notModified) return { notModified: true, http, contentHash: null, notices: [] };

    const entries = parseTnpscList(list.body, list.finalUrl);
    if (entries.length === 0) throw new ParseError("TNPSC list: no notifications found (layout may have changed)");

    const notices: ParsedNotice[] = [];
    for (const entry of entries.slice(0, MAX_DETAILS_PER_RUN)) {
      const detail = await ctx.fetch(entry.detailUrl, { etag: null, lastModified: null });
      notices.push(parseTnpscDetail(detail.body, entry));
    }
    // Hash the parsed facts, not the raw page (ASP.NET viewstate changes on every request).
    return { notModified: false, http, contentHash: sha256(JSON.stringify(notices)), notices };
  },
};
