import { afterAll, describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { examService } from "@/server/services/exam-service";
import { schemeService } from "@/server/services/scheme-service";
import { searchService } from "@/server/services/search-service";
import { getDeadlineFirstGroups } from "@/server/services/discovery-service";
import { adminWriteService } from "@/server/services/admin-write-service";
import { load } from "@/server/services/load";
import { isApplicationInactive } from "@/domain/status";

/** Real-database integration tests. They FAIL (not skip) when the database is unreachable. */

const created: string[] = [];
afterAll(async () => {
  await db.auditLog.deleteMany({ where: { entityId: { in: created } } });
  await db.exam.deleteMany({ where: { id: { in: created } } });
});

async function anyOrgId() {
  return (await db.organization.findFirstOrThrow()).id;
}

describe("Services on the seeded database", () => {
  it("lists exams with status, freshness and canonical application period", async () => {
    const { exams, total } = await examService.listExams({ limit: 10 });
    expect(total).toBeGreaterThanOrEqual(20);
    const e = exams[0];
    expect(e.applicationStatus.status).toBeTruthy();
    expect(e.freshness.state).toBeTruthy();
    expect(e).toHaveProperty("applicationPeriod");
    expect(e.sources.length).toBeGreaterThan(0);
  });

  it("schemes read deadlines from ApplicationPeriod only", async () => {
    const { schemes } = await schemeService.listSchemes({ limit: 50 });
    expect(schemes.length).toBeGreaterThanOrEqual(20);
    for (const s of schemes) {
      expect(s).not.toHaveProperty("deadline");
      expect(s.applicationPeriod).not.toBeNull();
      expect(s.status).toBe(s.applicationStatus);
    }
  });

  it("detail by slug, and unknown slug is null", async () => {
    const exam = await examService.getExamBySlug("upsc-cse-2026");
    expect(exam?.conductingBody.name).toContain("UPSC");
    expect(await examService.getExamBySlug("does-not-exist")).toBeNull();
  });

  it("unified search hits both catalogues", async () => {
    const r = await searchService.searchAll("UPSC");
    expect(r.totalExams).toBeGreaterThan(0);
  });

  it("deadline-first groups never contain closed/cancelled items or untrusted urgent items", async () => {
    const g = await getDeadlineFirstGroups();
    const listed = [...g.closingSoon, ...g.open, ...g.upcoming, ...g.needsConfirmation, ...g.unknown];
    expect(listed.length).toBeGreaterThan(0);
    for (const i of listed) expect(isApplicationInactive(i.applicationStatus.status)).toBe(false);
    for (const i of [...g.closingSoon, ...g.open, ...g.upcoming]) expect(i.freshness.trustworthy).toBe(true);
  });
});

describe("Admin writes", () => {
  it("creates exams as unpublished drafts with IST end-of-day deadline and an audit entry", async () => {
    const exam = await adminWriteService.createExam(
      {
        name: "Integration Test Exam",
        slug: `itest-exam-${Date.now()}`,
        conductingBodyId: await anyOrgId(),
        educationEligibility: "Graduate",
        ageEligibility: "18-30",
        officialApplyUrl: "https://example.gov.in/apply",
        opensAt: new Date("2026-10-01T00:00:00+05:30"),
        closesAt: new Date("2026-11-05T23:59:59.999+05:30"),
        categoryIds: [],
        sources: [{ url: "https://example.gov.in/notice.pdf", type: "OFFICIAL_NOTIFICATION" }],
        examDate: undefined,
        admitCardDate: undefined,
      },
      "itest-admin"
    );
    created.push(exam.id);
    expect(exam.isPublished).toBe(false);
    expect(await db.verification.count({ where: { examId: exam.id } })).toBe(0);
    expect(await db.auditLog.count({ where: { entityId: exam.id, action: "exam.create" } })).toBe(1);
    // Drafts are invisible publicly.
    expect(await examService.getExamBySlug(exam.slug)).toBeNull();
  });

  it("updates record a field-level diff, and verification only with a note", async () => {
    const id = created[0];
    await adminWriteService.updateExam(id, { closesAt: new Date("2026-11-12T18:29:59.999Z"), isPublished: true, verificationNote: "Checked corrigendum PDF" }, "itest-admin");
    const log = await db.auditLog.findFirstOrThrow({ where: { entityId: id, action: "exam.update" } });
    const changes = log.changes as Record<string, { from: unknown; to: unknown }>;
    expect(changes.closesAt.to).toBe("2026-11-12T18:29:59.999Z");
    expect(changes.isPublished).toEqual({ from: false, to: true });
    expect(await db.verification.count({ where: { examId: id, verifiedBy: "itest-admin" } })).toBe(1);
  });

  it("published / unpublished / archived filtering", async () => {
    const id = created[0];
    const slug = (await db.exam.findUniqueOrThrow({ where: { id } })).slug;
    expect(await examService.getExamBySlug(slug)).not.toBeNull();
    await adminWriteService.updateExam(id, { isArchived: true }, "itest-admin");
    const live = await examService.listExams({ search: "Integration Test Exam" });
    expect(live.exams.find((e) => e.id === id)).toBeUndefined();
    const archive = await examService.listExams({ search: "Integration Test Exam", isArchived: true });
    expect(archive.exams.find((e) => e.id === id)?.isArchived).toBe(true);
  });
});

describe("Database unavailable vs empty result", () => {
  it("connection failures become DB_UNAVAILABLE instead of an empty list", async () => {
    const r = await load("TEST", async () => {
      throw new Prisma.PrismaClientInitializationError("Can't reach database server at `localhost:1`", "6.19.3");
    });
    expect(r).toEqual({ ok: false, error: "DB_UNAVAILABLE" });
  });

  it("a successful empty result stays ok with an empty array", async () => {
    const r = await load("TEST", () => examService.listExams({ search: "zz-no-such-exam-zz" }));
    expect(r.ok && r.data.exams).toEqual([]);
  });
});
