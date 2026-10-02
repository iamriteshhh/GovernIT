import { describe, it, expect } from "vitest";
import { examQuerySchema } from "@/validation/exam-schema";
import { schemeQuerySchema } from "@/validation/scheme-schema";

describe("E2E & Functional: Multi-Criteria Filter Engine", () => {
  it("should validate and normalize valid filter parameters for exams", () => {
    const rawParams = {
      search: "Civil",
      category: "banking",
      state: "UK",
      centralOnly: "false",
      status: "closing-soon",
      limit: "25",
      offset: "10",
    };

    const parsed = examQuerySchema.safeParse(rawParams);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.search).toBe("Civil");
      expect(parsed.data.category).toBe("banking");
      expect(parsed.data.state).toBe("UK");
      expect(parsed.data.centralOnly).toBe(false);
      expect(parsed.data.status).toBe("closing-soon");
      expect(parsed.data.limit).toBe(25);
      expect(parsed.data.offset).toBe(10);
    }
  });

  it("should sanitize and fallback to safe defaults for empty filter parameters", () => {
    const parsed = schemeQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("all");
      expect(parsed.data.limit).toBe(20);
      expect(parsed.data.offset).toBe(0);
    }
  });

  it("should reject invalid limit boundaries", () => {
    const invalidUnder = examQuerySchema.safeParse({ limit: 0 });
    expect(invalidUnder.success).toBe(false);

    const invalidOver = examQuerySchema.safeParse({ limit: 500 });
    expect(invalidOver.success).toBe(false);
  });
});
