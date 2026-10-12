import { z } from "zod";
import { parseISTDate } from "@/lib/dates";

/**
 * Parses admin/adapter date input into an instant. Accepted forms:
 *  - "YYYY-MM-DD"           IST calendar date; "end" edge = 23:59:59.999 IST (for deadlines)
 *  - "YYYY-MM-DDTHH:MM"     IST wall-clock time
 *  - full ISO with Z/offset exact instant
 */
export function parseIstInput(value: string, edge: "start" | "end"): Date | null {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return parseISTDate(v, edge);
  const local = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (local) {
    const day = parseISTDate(local[1], "start");
    const [h, m] = [Number(local[2]), Number(local[3])];
    if (!day || h > 23 || m > 59) return null;
    return new Date(day.getTime() + (h * 60 + m) * 60_000);
  }
  if (/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/.test(v)) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Optional/nullable IST date field: "" and null clear the value; undefined leaves it untouched. */
export const istDateField = (edge: "start" | "end") =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined) return undefined;
      if (v === null || v.trim() === "") return null;
      const d = parseIstInput(v, edge);
      if (!d) {
        ctx.addIssue({ code: "custom", message: "Use a date like 2026-11-05 (optionally with time 23:59)" });
        return z.NEVER;
      }
      return d;
    });

