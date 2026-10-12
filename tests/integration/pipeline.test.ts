import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { runSourceCheck } from "@/server/ingestion/pipeline";
import { reviewCandidate } from "@/server/ingestion/review";
import type { FetchResult, safeFetch } from "@/server/ingestion/safe-fetch";

/**
 * Source pipeline against the real database, with FIXTURE responses (no network).
 * Uses its own throwaway MonitoredSource so it never touches real source state.
 */
const fixture = (name: string) => fs.readFileSync(path.join(__dirname, "../fixtures/sources", name), "utf8");
const LIST = fixture("tnpsc-dashboard-list.html");
const DETAIL_11 = fixture("tnpsc-detail-11-2026.html");
const DETAIL_05 = fixture("tnpsc-detail-05-2026.html");

const key = `test-tnpsc-${Date.now()}`;
let sourceId = "";
let detail11 = DETAIL_11;
let mode: "ok" | "network-down" | "layout-changed" = "ok";

const fakeFetch = (async (url: string): Promise<FetchResult> => {
  if (mode === "network-down") throw Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
  const body = url.endsWith("index.aspx")
    ? mode === "layout-changed" ? "<html><body>Site under maintenance</body></html>" : LIST
    : url.includes("33aa5415") ? DETAIL_05 : detail11;
  return { status: 200, finalUrl: url, etag: null, lastModified: null, contentType: "text/html", body, notModified: false };
}) as typeof safeFetch;

const run = () => runSourceCheck(sourceId, { fetcher: fakeFetch });
const pending = () => db.changeCandidate.findMany({ where: { sourceId, state: "PENDING" } });

beforeAll(async () => {
  const s = await db.monitoredSource.create({
    data: {
      key,
      name: "TEST TNPSC (fixtures)",
      organization: "Tamil Nadu Public Service Commission (TNPSC)",
      kind: "HTML_TABLE",
      url: "https://tnpsc.gov.in/web/examdashboard/index.aspx",
      allowedHost: "tnpsc.gov.in",
      adapterId: "tnpsc-dashboard",
      adapterVersion: "1.0.0",
      opportunityType: "exam",
    },
  });
  sourceId = s.id;
});

afterAll(async () => {
  const exams = await db.exam.findMany({ where: { externalRef: { startsWith: `${key}:` } }, select: { id: true } });
  const ids = exams.map((e) => e.id);
  await db.auditLog.deleteMany({ where: { OR: [{ entityId: { in: ids } }, { action: { startsWith: "review." }, changes: { path: ["evidence"], string_contains: "tnpsc.gov.in" }, createdAt: { gte: new Date(Date.now() - 3_600_000) } }] } });
  await db.changeCandidate.deleteMany({ where: { sourceId } });
  await db.exam.deleteMany({ where: { id: { in: ids } } });
  await db.monitoredSource.delete({ where: { id: sourceId } });
});

describe("Source pipeline (fixtures, real DB)", () => {
  it("queues every new official notification for review and publishes nothing", async () => {
    const r = await run();
    expect(r.outcome).toBe("CHANGED");
    expect(r.itemsFound).toBe(7);
    const queued = await pending();
    expect(queued).toHaveLength(7);
    expect(queued.every((c) => c.kind === "NEW_OPPORTUNITY")).toBe(true);
    expect(await db.exam.count({ where: { externalRef: { startsWith: `${key}:` } } })).toBe(0);

    const check = await db.sourceCheck.findFirst({ where: { sourceId }, orderBy: { startedAt: "desc" } });
    expect(check?.parserVersion).toBe("tnpsc-dashboard@1.0.0");
    expect(check?.httpStatus).toBe(200);
    const source = await db.monitoredSource.findUniqueOrThrow({ where: { id: sourceId } });
    expect(source.lastSuccessAt).not.toBeNull();
    expect(source.lockedUntil).toBeNull();
  });

  it("is idempotent: a second run queues nothing new", async () => {
    const r = await run();
    expect(r.queued).toBe(0);
    expect(await pending()).toHaveLength(7);
  });

  it("approving creates an UNPUBLISHED draft with official dates, audit and verification", async () => {
    const c = (await pending()).find((x) => x.externalId === "11/2026")!;
    await reviewCandidate(c.id, { action: "approve", note: "Checked dashboard rows for 11/2026" }, "test-reviewer");

    const exam = await db.exam.findUniqueOrThrow({
      where: { externalRef: `${key}:11/2026` },
      include: { applicationPeriod: true, verifications: true, sources: true },
    });
    expect(exam.isPublished).toBe(false);
    expect(exam.applicationPeriod?.closesAt?.toISOString()).toBe("2026-11-05T18:29:00.000Z");
    expect(exam.examDate?.toISOString()).toBe("2027-01-09T18:30:00.000Z");
    expect(exam.verifications[0].verifiedBy).toBe("test-reviewer");
    expect(exam.sources.some((s) => s.type === "OFFICIAL_NOTIFICATION")).toBe(true);
    expect(await db.auditLog.count({ where: { entityId: exam.id, action: "review.approve.new_opportunity" } })).toBe(1);
  });

  it("re-confirms a matching record with an automated verification (evidence, not a click)", async () => {
    const r = await run();
    expect(r.verified).toBeGreaterThanOrEqual(1);
    const exam = await db.exam.findUniqueOrThrow({ where: { externalRef: `${key}:11/2026` }, include: { verifications: { orderBy: { verifiedAt: "desc" } } } });
    expect(exam.verifications[0].verifiedBy).toBe("auto:tnpsc-dashboard@1.0.0");
    expect(exam.verifications[0].notes).toContain("tnpsc.gov.in");
  });

  it("a changed deadline goes to review; the record keeps the last verified value", async () => {
    detail11 = DETAIL_11.replace("05.11.2026 - 11:59 P.M", "12.11.2026 - 11:59 P.M");
    await run();
    const exam = await db.exam.findUniqueOrThrow({ where: { externalRef: `${key}:11/2026` }, include: { applicationPeriod: true } });
    expect(exam.applicationPeriod?.closesAt?.toISOString()).toBe("2026-11-05T18:29:00.000Z");
    const change = (await pending()).find((c) => c.kind === "DATE_CHANGE" && c.examId === exam.id);
    expect(change).toBeDefined();
    expect((change!.proposed as Record<string, string>).closesAt).toBe("2026-11-12T18:29:00.000Z");
    expect((change!.current as Record<string, string>).closesAt).toBe("2026-11-05T18:29:00.000Z");
  });

  it("fetch failure never closes or edits records and keeps the last known good snapshot", async () => {
    const before = await db.monitoredSource.findUniqueOrThrow({ where: { id: sourceId } });
    mode = "network-down";
    const r = await run();
    mode = "ok";
    expect(r.outcome).toBe("FETCH_FAILED");
    const after = await db.monitoredSource.findUniqueOrThrow({ where: { id: sourceId } });
    expect(after.consecutiveFailures).toBe(1);
    expect(after.snapshot).toEqual(before.snapshot);
    expect(after.lastSuccessAt?.getTime()).toBe(before.lastSuccessAt?.getTime());
    const exam = await db.exam.findUniqueOrThrow({ where: { externalRef: `${key}:11/2026` }, include: { applicationPeriod: true } });
    expect(exam.lifecycle).toBe("ACTIVE");
    expect(exam.applicationPeriod?.closesAt?.toISOString()).toBe("2026-11-05T18:29:00.000Z");
  });

  it("layout change (empty parse) is a parser failure for review, not a deletion", async () => {
    mode = "layout-changed";
    const r = await run();
    mode = "ok";
    expect(r.outcome).toBe("PARSE_FAILED");
    expect((await pending()).some((c) => c.kind === "PARSER_FAILURE")).toBe(true);
    expect(await db.exam.count({ where: { externalRef: `${key}:11/2026` } })).toBe(1);
  });

  it("reviewer can approve a corrected value; rejection changes nothing", async () => {
    const exam = await db.exam.findUniqueOrThrow({ where: { externalRef: `${key}:11/2026` } });
    const change = (await pending()).find((c) => c.kind === "DATE_CHANGE" && c.examId === exam.id)!;
    await reviewCandidate(change.id, { action: "approve", note: "Corrigendum checked", corrections: { closesAt: "2026-11-12" } }, "test-reviewer");
    const updated = await db.exam.findUniqueOrThrow({ where: { id: exam.id }, include: { applicationPeriod: true } });
    expect(updated.applicationPeriod?.closesAt?.toISOString()).toBe("2026-11-12T18:29:59.999Z");

    const other = (await pending()).find((c) => c.externalId === "01/2026")!;
    await reviewCandidate(other.id, { action: "reject", note: "Not a civil recruitment" }, "test-reviewer");
    expect(await db.exam.count({ where: { externalRef: `${key}:01/2026` } })).toBe(0);
    expect((await db.changeCandidate.findUniqueOrThrow({ where: { id: other.id } })).state).toBe("REJECTED");
    await expect(reviewCandidate(other.id, { action: "approve", note: "again" }, "test-reviewer")).rejects.toThrow(/Already rejected/);
  });
});
