import { describe, it, expect } from "vitest";
import {
  calculateDaysLeftIST,
  formatDateIST,
  formatDateTimeIST,
  msUntilNextISTMidnight,
  parseISTDate,
  startOfDayIST,
  toISTDateInput,
} from "@/lib/dates";
import { parseIstInput } from "@/validation/dates";
import { evaluateFreshness } from "@/domain/freshness";
import { describeApplyAction } from "@/domain/links";
import { resolveTheme } from "@/lib/theme";

describe("IST date maths", () => {
  it("counts IST calendar days, not 24h blocks", () => {
    // 23:00 IST on 1 Jan vs 01:00 IST on 2 Jan: 2 hours apart, 1 calendar day
    expect(calculateDaysLeftIST("2026-01-01T19:30:00Z", new Date("2026-01-01T17:30:00Z"))).toBe(1);
    // 18:29 UTC = 23:59 IST same day
    expect(calculateDaysLeftIST("2026-01-01T18:29:00Z", new Date("2026-01-01T00:00:00Z"))).toBe(0);
  });

  it("start of IST day is 18:30 UTC of the previous day", () => {
    expect(startOfDayIST(new Date("2026-03-10T05:00:00Z")).toISOString()).toBe("2026-03-09T18:30:00.000Z");
  });

  it("time until IST midnight", () => {
    expect(msUntilNextISTMidnight(new Date("2026-03-10T18:00:00Z"))).toBe(30 * 60_000);
  });

  it("parses date-only deadlines to end of the IST day and rejects impossible dates", () => {
    expect(parseISTDate("2026-11-05", "end")!.toISOString()).toBe("2026-11-05T18:29:59.999Z");
    expect(parseISTDate("2026-11-05", "start")!.toISOString()).toBe("2026-11-04T18:30:00.000Z");
    expect(parseISTDate("2026-02-30", "start")).toBeNull();
  });

  it("formats deterministically in IST", () => {
    expect(formatDateIST("2026-11-05T18:29:00Z")).toBe("5 Nov 2026");
    expect(formatDateTimeIST("2026-11-05T18:29:00Z")).toBe("5 Nov 2026, 11:59 pm IST");
    expect(formatDateTimeIST("2026-11-05T06:30:00Z")).toBe("5 Nov 2026, 12:00 pm IST");
    expect(toISTDateInput("2026-11-04T19:00:00Z")).toBe("2026-11-05");
    expect(formatDateIST(null)).toBe("Not announced");
  });

  it("admin input: date, IST wall time, and explicit ISO", () => {
    expect(parseIstInput("2026-11-05", "end")!.toISOString()).toBe("2026-11-05T18:29:59.999Z");
    expect(parseIstInput("2026-11-05T17:00", "end")!.toISOString()).toBe("2026-11-05T11:30:00.000Z");
    expect(parseIstInput("2026-11-05T17:00:00Z", "end")!.toISOString()).toBe("2026-11-05T17:00:00.000Z");
    expect(parseIstInput("05/11/2026", "end")).toBeNull();
    expect(parseIstInput("2026-11-05T25:00", "end")).toBeNull();
  });
});

describe("Freshness (separate axis from lifecycle)", () => {
  const now = new Date("2026-06-15T00:00:00Z");
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

  it("never-verified records are UNVERIFIED and untrusted", () => {
    const f = evaluateFreshness({ kind: "exam", lastVerifiedAt: null }, now);
    expect(f.state).toBe("UNVERIFIED");
    expect(f.trustworthy).toBe(false);
  });

  it("exam: fresh < 72h, check due < 7d, stale after", () => {
    expect(evaluateFreshness({ kind: "exam", lastVerifiedAt: hoursAgo(10) }, now).state).toBe("FRESH");
    expect(evaluateFreshness({ kind: "exam", lastVerifiedAt: hoursAgo(80) }, now).state).toBe("CHECK_DUE");
    const stale = evaluateFreshness({ kind: "exam", lastVerifiedAt: hoursAgo(24 * 8) }, now);
    expect(stale.state).toBe("STALE");
    expect(stale.trustworthy).toBe(false);
  });

  it("schemes use slower thresholds", () => {
    expect(evaluateFreshness({ kind: "scheme", lastVerifiedAt: hoursAgo(24 * 20) }, now).state).toBe("FRESH");
    expect(evaluateFreshness({ kind: "scheme", lastVerifiedAt: hoursAgo(24 * 100) }, now).state).toBe("STALE");
  });

  it("per-source override and failure/review flags", () => {
    expect(evaluateFreshness({ kind: "scheme", lastVerifiedAt: hoursAgo(30), staleAfterHours: 24 }, now).state).toBe("STALE");
    expect(evaluateFreshness({ kind: "exam", lastVerifiedAt: hoursAgo(1), sourceFailing: true }, now).state).toBe("CHECK_FAILED");
    expect(evaluateFreshness({ kind: "exam", lastVerifiedAt: hoursAgo(1), reviewPending: true }, now).state).toBe("REVIEW_REQUIRED");
  });
});

describe("Official link presentation", () => {
  const fresh = evaluateFreshness({ kind: "exam", lastVerifiedAt: new Date() });
  const unverified = evaluateFreshness({ kind: "exam", lastVerifiedAt: null });

  it("direct form + open + verified => primary Apply button", () => {
    const a = describeApplyAction({ status: "APPLICATION_OPEN", linkKind: "DIRECT_APPLICATION", freshness: fresh });
    expect(a).toMatchObject({ label: "Apply on Official Site", emphasis: "primary", caution: null });
  });

  it("homepage is never labelled Apply", () => {
    const a = describeApplyAction({ status: "CLOSING_SOON", linkKind: "DEPARTMENT_SITE", freshness: fresh });
    expect(a.label).toBe("Official department site");
    expect(a.emphasis).toBe("secondary");
  });

  it("closed application never presents the form as accepting submissions", () => {
    const a = describeApplyAction({ status: "CLOSED", linkKind: "DIRECT_APPLICATION", freshness: fresh });
    expect(a.label).toContain("applications closed");
    expect(a.emphasis).toBe("secondary");
  });

  it("unverified open listing carries a confirmation caution", () => {
    const a = describeApplyAction({ status: "APPLICATION_OPEN", linkKind: "APPLICATION_PORTAL", freshness: unverified });
    expect(a.caution).toMatch(/needs confirmation/i);
  });

  it("repeated link failures add a caution but do not change the status", () => {
    const a = describeApplyAction({
      status: "APPLICATION_OPEN",
      linkKind: "APPLICATION_PORTAL",
      freshness: fresh,
      linkHealth: { result: "NETWORK_ERROR", consecutiveFailures: 3, lastCheckedAt: new Date() },
    });
    expect(a.emphasis).toBe("primary");
    expect(a.caution).toMatch(/could not reach/i);
  });
});

describe("Theme preference", () => {
  it("saved choice wins, else system preference", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("garbage", false)).toBe("light");
  });
});
