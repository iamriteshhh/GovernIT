import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

/** Checks the seeded database. Fails (does not skip) when the database is unreachable. */
describe("Seeded dataset integrity", () => {
  it("has the expected volume", async () => {
    expect(await db.exam.count()).toBeGreaterThanOrEqual(20);
    expect(await db.scheme.count()).toBeGreaterThanOrEqual(20);
    expect(await db.state.count()).toBeGreaterThanOrEqual(10);
    expect(await db.category.count()).toBeGreaterThanOrEqual(12);
    expect(await db.monitoredSource.count({ where: { key: { in: ["tnpsc-exam-dashboard", "bpsc-notification-sitemap"] } } })).toBe(2);
  });

  it("every exam and scheme has an organisation, an official source and a canonical application period", async () => {
    const exams = await db.exam.findMany({ include: { sources: true, conductingBody: true, applicationPeriod: true } });
    for (const e of exams) {
      expect(e.conductingBody.name).toBeTruthy();
      expect(e.sources.length).toBeGreaterThan(0);
      expect(e.applicationPeriod, e.slug).not.toBeNull();
    }
    const schemes = await db.scheme.findMany({ include: { sources: true, department: true, applicationPeriod: true } });
    for (const s of schemes) {
      expect(s.department.name).toBeTruthy();
      expect(s.sources.length).toBeGreaterThan(0);
      expect(s.applicationPeriod, s.slug).not.toBeNull();
    }
  });

  it("no record carries a fabricated seed verification", async () => {
    expect(await db.verification.count({ where: { verifiedBy: "editorial_audit" } })).toBe(0);
  });

  it("seed records (not from a monitored source) carry no invented dates", async () => {
    const dated = await db.exam.count({
      where: {
        externalRef: null,
        verifications: { none: {} },
        OR: [{ examDate: { not: null } }, { applicationPeriod: { closesAt: { not: null } } }],
      },
    });
    expect(dated).toBe(0);
  });
});
