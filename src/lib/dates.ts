/**
 * Date and Time utilities for GovernIT
 * All dates stored in UTC in the database, displayed and calculated in IST (India Standard Time: UTC+5:30).
 * IST has no daylight saving, so a fixed offset is exact.
 */

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return isNaN(d.getTime()) ? null : d;
}

export function getNowIST(): Date {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MS);
}

/** Start of the IST calendar day containing `date`, as a real instant. */
export function startOfDayIST(date: Date): Date {
  const shifted = date.getTime() + IST_OFFSET_MS;
  return new Date(shifted - (shifted % DAY_MS) - IST_OFFSET_MS);
}

/** Milliseconds until the next IST midnight (used to refresh countdowns across the date boundary). */
export function msUntilNextISTMidnight(now: Date = new Date()): number {
  return startOfDayIST(now).getTime() + DAY_MS - now.getTime();
}

/**
 * Converts an IST calendar date ("YYYY-MM-DD") into an instant.
 * "start" = 00:00:00.000 IST, "end" = 23:59:59.999 IST (use "end" for deadlines entered as a date only).
 */
export function parseISTDate(value: string, edge: "start" | "end"): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utcMidnight = Date.UTC(y, mo - 1, d);
  const check = new Date(utcMidnight);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  const start = utcMidnight - IST_OFFSET_MS;
  return new Date(edge === "start" ? start : start + DAY_MS - 1);
}

/** "YYYY-MM-DD" of the IST calendar day (for <input type="date"> values). */
export function toISTDateInput(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Calculates remaining calendar days in IST between now and a target date.
 * Returns negative if the date is in the past.
 */
export function calculateDaysLeftIST(targetDate: Date | string | null | undefined, fromDate: Date = new Date()): number | null {
  const target = toDate(targetDate);
  if (!target) return null;

  const targetDay = startOfDayIST(target).getTime();
  const fromDay = startOfDayIST(fromDate).getTime();
  return Math.round((targetDay - fromDay) / DAY_MS);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** IST wall-clock parts. Deterministic (no Intl), so server and browser render identical text. */
function istParts(d: Date) {
  const s = new Date(d.getTime() + IST_OFFSET_MS);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate(), h: s.getUTCHours(), min: s.getUTCMinutes() };
}

/**
 * Formats a date into a clean Indian standard format: DD MMM YYYY (e.g. 15 Oct 2026)
 */
export function formatDateIST(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return "Not announced";
  const p = istParts(d);
  return `${p.d} ${MONTHS[p.m]} ${p.y}`;
}

/** "5 Nov 2026, 11:59 pm IST" */
export function formatDateTimeIST(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return "Not announced";
  const p = istParts(d);
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${formatDateIST(d)}, ${h12}:${String(p.min).padStart(2, "0")} ${p.h < 12 ? "am" : "pm"} IST`;
}
