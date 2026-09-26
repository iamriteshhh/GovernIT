/**
 * Date and Time utilities for GovernIT
 * All dates stored in UTC in the database, displayed and calculated in IST (India Standard Time: UTC+5:30).
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function getNowIST(): Date {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MS);
}

/**
 * Calculates remaining calendar days in IST between now and a target date.
 * Returns negative if the date is in the past.
 */
export function calculateDaysLeftIST(targetDate: Date | string | null | undefined, fromDate: Date = new Date()): number | null {
  if (!targetDate) return null;
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  if (isNaN(target.getTime())) return null;

  // Convert both to IST day strings (YYYY-MM-DD) to compare calendar boundaries
  const targetIST = new Date(target.getTime() + IST_OFFSET_MS);
  const fromIST = new Date(fromDate.getTime() + IST_OFFSET_MS);

  const targetDay = Date.UTC(targetIST.getUTCFullYear(), targetIST.getUTCMonth(), targetIST.getUTCDate());
  const fromDay = Date.UTC(fromIST.getUTCFullYear(), fromIST.getUTCMonth(), fromIST.getUTCDate());

  const diffMs = targetDay - fromDay;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a date into a clean Indian standard format: DD MMM YYYY (e.g. 15 Oct 2026)
 */
export function formatDateIST(date: Date | string | null | undefined): string {
  if (!date) return "Not announced";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Not announced";

  const dIST = new Date(d.getTime() + IST_OFFSET_MS);
  return dIST.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
