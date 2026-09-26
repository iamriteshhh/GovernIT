import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Phase 3 Verified Dataset Integrity", () => {
  it("should have seeded at least 20 exams and 20 schemes", async () => {
    const examCount = await db.exam.count();
    const schemeCount = await db.scheme.count();

    expect(examCount).toBeGreaterThanOrEqual(20);
    expect(schemeCount).toBeGreaterThanOrEqual(20);
  });

  it("should ensure every exam has at least one official source and a verification record", async () => {
    const exams = await db.exam.findMany({
      include: {
        sources: true,
        verifications: true,
        conductingBody: true,
      },
    });

    for (const exam of exams) {
      expect(exam.sources.length).toBeGreaterThan(0);
      expect(exam.sources[0].url).toBeTruthy();
      expect(exam.verifications.length).toBeGreaterThan(0);
      expect(exam.verifications[0].verifiedAt).toBeDefined();
      expect(exam.conductingBody.name).toBeTruthy();
    }
  });

  it("should ensure every scheme has at least one official source and a verification record", async () => {
    const schemes = await db.scheme.findMany({
      include: {
        sources: true,
        verifications: true,
        department: true,
      },
    });

    for (const scheme of schemes) {
      expect(scheme.sources.length).toBeGreaterThan(0);
      expect(scheme.sources[0].url).toBeTruthy();
      expect(scheme.verifications.length).toBeGreaterThan(0);
      expect(scheme.verifications[0].verifiedAt).toBeDefined();
      expect(scheme.department.name).toBeTruthy();
    }
  });
});
