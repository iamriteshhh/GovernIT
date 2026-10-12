import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { runSourceCheck } from "@/server/ingestion/pipeline";
import type { FetchResult, safeFetch } from "@/server/ingestion/safe-fetch";

/** Notices feed and auto-publish, real DB, fixture responses (no network). */
const fixture = (name: string) => fs.readFileSync(path.join(__dirname, "../fixtures/sources", name), "utf8");
const stamp = Date.now();
const sourceIds: string[] = [];

const serve = (pick: (url: string) => string) =>
  (async (url: string): Promise<FetchResult> => ({ status: 200, finalUrl: url, etag: null, lastModified: null, contentType: "text/html", body: pick(url), notModified: false })) as typeof safeFetch;

async function makeSource(data: { key: string; adapterId: string; url: string; allowedHost: string; opportunityType: string; autoPublish?: boolean; organization: string }) {
  const s = await db.monitoredSource.create({ data: { name: data.key, kind: "TEST", adapterVersion: "1.0.0", ...data } });
  sourceIds.push(s.id);
  return s;
}

afterAll(async () => {
  const exams = await db.exam.findMany({ where: { monitoredSourceId: { in: sourceIds } }, select: { id: true } });
  await db.auditLog.deleteMany({ where: { entityId: { in: exams.map((e) => e.id) } } });
  await db.exam.deleteMany({ where: { id: { in: exams.map((e) => e.id) } } });
  await db.monitoredSource.deleteMany({ where: { id: { in: sourceIds } } }); // cascades notices, checks
});

describe("Official notices feed", () => {
  it("stores official titles/links/dates once, and a re-run adds nothing", async () => {
    const s = await makeSource({ key: `test-rpsc-${stamp}`, adapterId: "rpsc-news", url: "https://rpsc.rajasthan.gov.in/", allowedHost: "rpsc.rajasthan.gov.in", opportunityType: "notice", organization: "RPSC" });
    const fetcher = serve(() => fixture("rpsc-home.html"));
    const first = await runSourceCheck(s.id, { fetcher });
    expect(first.outcome).toBe("CHANGED");
    expect(first.noticesAdded).toBe(40);
    expect(await db.changeCandidate.count({ where: { sourceId: s.id } })).toBe(0); // feed items are not review items
    const n = await db.officialNotice.findFirstOrThrow({ where: { sourceId: s.id }, orderBy: { publishedOn: "desc" } });
    expect(n.url).toMatch(/^https:\/\/rpsc\.rajasthan\.gov\.in\//);
    const second = await runSourceCheck(s.id, { fetcher });
    expect(second.noticesAdded).toBe(0);
    expect(await db.officialNotice.count({ where: { sourceId: s.id } })).toBe(40);
  });
});

describe("Auto-publish (TNPSC-style structured source)", () => {
  it("publishes complete official records with a verification; ambiguous ones still go to review", async () => {
    const s = await makeSource({ key: `test-tnpsc-auto-${stamp}`, adapterId: "tnpsc-dashboard", url: "https://tnpsc.gov.in/web/examdashboard/index.aspx", allowedHost: "tnpsc.gov.in", opportunityType: "exam", autoPublish: true, organization: "Tamil Nadu Public Service Commission (TNPSC)" });
    const ambiguous05 = fixture("tnpsc-detail-05-2026.html").replace("29.07.2026 11.59 PM", "to be notified");
    const fetcher = serve((url) => (url.endsWith("index.aspx") ? fixture("tnpsc-dashboard-list.html") : url.includes("33aa5415") ? ambiguous05 : fixture("tnpsc-detail-11-2026.html")));
    const r = await runSourceCheck(s.id, { fetcher });
    expect(r.autoApplied).toBe(6);

    const published = await db.exam.findUniqueOrThrow({ where: { externalRef: `${s.key}:11/2026` }, include: { verifications: true, applicationPeriod: true } });
    expect(published.isPublished).toBe(true);
    expect(published.applicationPeriod?.closesAt?.toISOString()).toBe("2026-11-05T18:29:00.000Z");
    expect(published.verifications[0].verifiedBy).toBe("auto:tnpsc-dashboard@1.0.0");
    expect(await db.auditLog.count({ where: { entityId: published.id, action: "exam.autopublish" } })).toBe(1);

    expect(await db.exam.count({ where: { externalRef: `${s.key}:05/2026` } })).toBe(0);
    expect(await db.changeCandidate.count({ where: { sourceId: s.id, externalId: "05/2026", state: "PENDING" } })).toBe(1);
  });
});
