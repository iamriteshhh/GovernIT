import { describe, it, expect } from "vitest";
import { evaluateApplicationStatus, evaluateExamScheduleStatus } from "@/domain/status";

describe("Status Engine - Pure Calculations", () => {
  const baseNow = new Date("2026-06-15T10:00:00Z");

  it("should evaluate as NOT_ANNOUNCED when dates are null", () => {
    const result = evaluateApplicationStatus(null, null, baseNow);
    expect(result.status).toBe("NOT_ANNOUNCED");
    expect(result.daysLeft).toBeNull();
  });

  it("should evaluate as APPLICATION_OPEN when deadline is far (> 7 days)", () => {
    const opensAt = new Date("2026-06-01T00:00:00Z");
    const closesAt = new Date("2026-06-30T23:59:59Z"); // 15 days later

    const result = evaluateApplicationStatus(opensAt, closesAt, baseNow);
    expect(result.status).toBe("APPLICATION_OPEN");
    expect(result.daysLeft).toBeGreaterThan(7);
    expect(result.urgencyLevel).toBe("normal");
  });

  it("should evaluate as CLOSING_SOON when deadline is within 7 days", () => {
    const opensAt = new Date("2026-06-01T00:00:00Z");
    const closesAt = new Date("2026-06-20T23:59:59Z"); // 5 days later

    const result = evaluateApplicationStatus(opensAt, closesAt, baseNow);
    expect(result.status).toBe("CLOSING_SOON");
    expect(result.daysLeft).toBeLessThanOrEqual(7);
    expect(result.urgencyLevel).toBe("urgent");
  });

  it("should evaluate as CLOSED when deadline has passed", () => {
    const opensAt = new Date("2026-05-01T00:00:00Z");
    const closesAt = new Date("2026-06-10T23:59:59Z"); // 5 days in the past

    const result = evaluateApplicationStatus(opensAt, closesAt, baseNow);
    expect(result.status).toBe("CLOSED");
    expect(result.urgencyLevel).toBe("closed");
  });

  it("should evaluate open-ended schemes (null closesAt) as APPLICATION_OPEN", () => {
    const opensAt = new Date("2026-01-01T00:00:00Z");

    const result = evaluateApplicationStatus(opensAt, null, baseNow);
    expect(result.status).toBe("APPLICATION_OPEN");
    expect(result.daysLeft).toBeNull();
  });

  it("should evaluate future exam date as EXAM_UPCOMING", () => {
    const examDate = new Date("2026-07-15T09:00:00Z");

    const result = evaluateExamScheduleStatus(examDate, null, baseNow);
    expect(result.status).toBe("EXAM_UPCOMING");
    expect(result.daysLeft).toBeGreaterThan(0);
  });

  it("should evaluate passed exam date as EXAM_COMPLETED", () => {
    const examDate = new Date("2026-05-15T09:00:00Z");

    const result = evaluateExamScheduleStatus(examDate, null, baseNow);
    expect(result.status).toBe("EXAM_COMPLETED");
  });

  it("should prioritize RESULT_ANNOUNCED when official result is declared", () => {
    const examDate = new Date("2026-05-15T09:00:00Z");

    const result = evaluateExamScheduleStatus(examDate, "Result Declared on Official Portal", baseNow);
    expect(result.status).toBe("RESULT_ANNOUNCED");
  });
});
