import { describe, it, expect } from "vitest";
import {
  evaluateApplicationStatus,
  evaluateExamScheduleStatus,
  describeProgramEnd,
  isApplicationActionable,
} from "@/domain/status";

// 2026-06-15 15:30 IST
const baseNow = new Date("2026-06-15T10:00:00Z");

describe("Application status (pure)", () => {
  it("is NOT_ANNOUNCED when no dates and not rolling", () => {
    const r = evaluateApplicationStatus({ opensAt: null, closesAt: null }, baseNow);
    expect(r.status).toBe("NOT_ANNOUNCED");
    expect(r.daysLeft).toBeNull();
  });

  it("is APPLICATION_OPEN when deadline is more than 7 IST days away", () => {
    const r = evaluateApplicationStatus({ opensAt: "2026-06-01T00:00:00Z", closesAt: "2026-06-30T18:29:59Z" }, baseNow);
    expect(r.status).toBe("APPLICATION_OPEN");
    expect(r.daysLeft).toBe(15);
  });

  it("is CLOSING_SOON at exactly the 7-day threshold", () => {
    const r = evaluateApplicationStatus({ opensAt: "2026-06-01T00:00:00Z", closesAt: "2026-06-22T18:29:00Z" }, baseNow);
    expect(r.status).toBe("CLOSING_SOON");
    expect(r.daysLeft).toBe(7);
  });

  it("is APPLICATION_OPEN at 8 days", () => {
    const r = evaluateApplicationStatus({ opensAt: "2026-06-01T00:00:00Z", closesAt: "2026-06-23T18:29:00Z" }, baseNow);
    expect(r.status).toBe("APPLICATION_OPEN");
  });

  it("is CLOSED the instant the deadline passes, even on the same IST day", () => {
    const closesAt = new Date("2026-06-15T09:59:59Z"); // one second before now, same IST day
    const r = evaluateApplicationStatus({ opensAt: "2026-06-01T00:00:00Z", closesAt }, baseNow);
    expect(r.status).toBe("CLOSED");
    expect(isApplicationActionable(r.status)).toBe(false);
  });

  it("is CLOSING_SOON with 0 days left just before a same-day deadline", () => {
    const closesAt = new Date("2026-06-15T18:29:00Z"); // 11:59 pm IST today
    const r = evaluateApplicationStatus({ opensAt: "2026-06-01T00:00:00Z", closesAt }, baseNow);
    expect(r.status).toBe("CLOSING_SOON");
    expect(r.daysLeft).toBe(0);
    expect(r.displayText).toContain("11:59 pm IST");
  });

  it("is UPCOMING (not NOT_ANNOUNCED) before the opening instant", () => {
    const r = evaluateApplicationStatus({ opensAt: "2026-06-20T00:00:00Z", closesAt: "2026-07-20T00:00:00Z" }, baseNow);
    expect(r.status).toBe("UPCOMING");
    expect(r.displayText).toContain("20 Jun 2026");
  });

  it("treats a rolling scheme as open with no deadline", () => {
    const r = evaluateApplicationStatus({ opensAt: null, closesAt: null, isRolling: true }, baseNow);
    expect(r.status).toBe("APPLICATION_OPEN");
    expect(r.daysLeft).toBeNull();
  });

  it("a passed deadline wins over isRolling or any stale flag", () => {
    const r = evaluateApplicationStatus({ closesAt: "2026-06-01T00:00:00Z", isRolling: true }, baseNow);
    expect(r.status).toBe("CLOSED");
  });

  it.each(["CANCELLED", "WITHDRAWN", "SUPERSEDED"] as const)("%s is never actionable, whatever the dates say", (lifecycle) => {
    const r = evaluateApplicationStatus({ opensAt: "2026-06-01T00:00:00Z", closesAt: "2026-06-30T00:00:00Z", lifecycle }, baseNow);
    expect(r.status).toBe(lifecycle);
    expect(isApplicationActionable(r.status)).toBe(false);
  });
});

describe("Exam schedule status (pure)", () => {
  it("future exam date is EXAM_UPCOMING", () => {
    expect(evaluateExamScheduleStatus("2026-07-15T09:00:00Z", null, baseNow).status).toBe("EXAM_UPCOMING");
  });

  it("exam today (IST) is still upcoming with 0 days", () => {
    const r = evaluateExamScheduleStatus("2026-06-14T19:00:00Z", null, baseNow); // 00:30 IST on the 15th
    expect(r.status).toBe("EXAM_UPCOMING");
    expect(r.daysLeft).toBe(0);
  });

  it("past exam date is EXAM_COMPLETED", () => {
    expect(evaluateExamScheduleStatus("2026-05-15T09:00:00Z", null, baseNow).status).toBe("EXAM_COMPLETED");
  });

  it("prioritises RESULT_ANNOUNCED when the official result is declared", () => {
    expect(evaluateExamScheduleStatus("2026-05-15T09:00:00Z", "Result Declared on Official Portal", baseNow).status).toBe("RESULT_ANNOUNCED");
  });

  it("cancelled exam is CANCELLED", () => {
    expect(evaluateExamScheduleStatus("2026-07-15T09:00:00Z", null, baseNow, "CANCELLED").status).toBe("CANCELLED");
  });
});

describe("Programme end is distinct from application deadline", () => {
  it("describes future and past programme ends with different wording", () => {
    expect(describeProgramEnd("2027-03-31T18:29:59Z", baseNow)).toBe("Programme ending on 31 Mar 2027");
    expect(describeProgramEnd("2026-03-31T18:29:59Z", baseNow)).toBe("Programme ended on 31 Mar 2026");
    expect(describeProgramEnd(null, baseNow)).toBeNull();
  });
});
