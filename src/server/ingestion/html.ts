import { createHash } from "node:crypto";
import { parseISTDate } from "@/lib/dates";

/** Minimal, dependency-free HTML helpers for well-known official page structures. */

export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

export function textOf(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export function hrefsOf(html: string): string[] {
  return [...html.matchAll(/href\s*=\s*"([^"]+)"/gi)].map((m) => decodeEntities(m[1]));
}

/** Resolves a (possibly relative, possibly space-containing) href against a base URL. */
export function absoluteUrl(href: string, base: string): string | null {
  try {
    return new URL(encodeURI(decodeURI(href.trim())), base).toString();
  } catch {
    return null;
  }
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/** "05.11.2026", "05/11/2026", "05-11-2026" (DD MM YYYY, Indian order) -> "2026-11-05". */
export function indianDateToIso(d: string, m: string, y: string): string | null {
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return parseISTDate(iso, "start") ? iso : null;
}

export const DATE_RE = /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/g;

/** All DD.MM.YYYY-style dates in a string, as YYYY-MM-DD. */
export function allIndianDates(text: string): string[] {
  return [...text.matchAll(DATE_RE)].map((m) => indianDateToIso(m[1], m[2], m[3])).filter((x): x is string => Boolean(x));
}
