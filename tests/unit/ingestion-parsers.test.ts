import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { parseTnpscDetail, parseTnpscList, TnpscListEntry } from "@/server/ingestion/adapters/tnpsc-dashboard";
import { latestNotificationSitemap, parseNotificationSitemap, parseSitemapIndex } from "@/server/ingestion/adapters/bpsc-sitemap";
import { ParseError } from "@/server/ingestion/types";
import { MAX_NOTICES, parseJpsc, parseKeralaPsc, parsePpsc, parseRpsc } from "@/server/ingestion/adapters/notice-lists";

/** Fixtures are real pages saved on 2026-10-12 (viewstate blobs stripped). Tests below never touch the network. */
const fixture = (name: string) => fs.readFileSync(path.join(__dirname, "../fixtures/sources", name), "utf8");
const BASE = "https://tnpsc.gov.in/web/examdashboard/index.aspx";

describe("TNPSC dashboard adapter (fixtures)", () => {
  const list = parseTnpscList(fixture("tnpsc-dashboard-list.html"), BASE);
  const entry = (n: string) => list.find((e) => e.number === n) as TnpscListEntry;

  it("lists all 2026 notifications with number and detail URL", () => {
    expect(list).toHaveLength(7);
    expect(list.map((e) => e.number)).toContain("11/2026");
    expect(entry("11/2026").detailUrl).toMatch(/^https:\/\/tnpsc\.gov\.in\/web\/examdashboard\/index\.aspx\?notid=/);
  });

  it("parses '05.11.2026 - 11:59 P.M' as 11:59 pm IST", () => {
    const n = parseTnpscDetail(fixture("tnpsc-detail-11-2026.html"), entry("11/2026"));
    expect(n.opensAt).toBe("2026-10-05T18:30:00.000Z");
    expect(n.closesAt).toBe("2026-11-05T18:29:00.000Z");
    expect(n.examDate).toBe("2027-01-09T18:30:00.000Z");
    expect(n.noticeUrl).toBe("https://tnpsc.gov.in/document/english/group_english.pdf");
    expect(n.applyUrl).toMatch(/^https:\/\/apply\.tnpscexams\.in\//);
    expect(n.ambiguous).toEqual([]);
  });

  it("parses the '29.07.2026 11.59 PM' variant and encodes spaces in PDF links", () => {
    const n = parseTnpscDetail(fixture("tnpsc-detail-05-2026.html"), entry("05/2026"));
    expect(n.closesAt).toBe("2026-07-29T18:29:00.000Z");
    expect(n.noticeUrl).toBe("https://tnpsc.gov.in/document/english/Group%20I%20Notification%202026_E.pdf");
    expect(n.lifecycleSignal).toBeNull(); // "postponement" press release is not a cancellation
  });

  it("missing apply row => no dates (never guessed)", () => {
    const html = fixture("tnpsc-detail-11-2026.html").replace(/<tr>\s*<td[^>]*>Apply Online[\s\S]*?<\/tr>/, "");
    const n = parseTnpscDetail(html, entry("11/2026"));
    expect(n.opensAt).toBeNull();
    expect(n.closesAt).toBeNull();
    expect(n.applyUrl).toBeNull();
    expect(n.examDate).not.toBeNull();
  });

  it("unparseable last date is flagged ambiguous, not guessed", () => {
    const html = fixture("tnpsc-detail-11-2026.html").replace("05.11.2026 - 11:59 P.M", "to be notified shortly");
    const n = parseTnpscDetail(html, entry("11/2026"));
    expect(n.closesAt).toBeNull();
    expect(n.ambiguous).toContain("closesAt");
  });

  it("multiple exam dates are ambiguous", () => {
    const html = fixture("tnpsc-detail-11-2026.html").replace("Date of Examination : 10/01/2027", "Date of Examination : 10/01/2027 and 11/01/2027");
    expect(parseTnpscDetail(html, entry("11/2026")).ambiguous).toContain("examDate");
  });

  it("cancellation wording raises a lifecycle signal for review", () => {
    const html = fixture("tnpsc-detail-11-2026.html").replace("Date of Examination : 10/01/2027", "Notification cancelled. Date of Examination : 10/01/2027");
    expect(parseTnpscDetail(html, entry("11/2026")).lifecycleSignal).toBe("CANCELLED");
  });

  it("changed layout (no table) raises ParseError", () => {
    expect(() => parseTnpscDetail("<html><body>Maintenance</body></html>", entry("11/2026"))).toThrow(ParseError);
  });

  it("empty list page parses to zero entries (adapter turns this into a failure)", () => {
    expect(parseTnpscList("<html></html>", BASE)).toEqual([]);
  });
});

describe("BPSC sitemap adapter (fixtures)", () => {
  it("finds the newest notification sitemap in the index", () => {
    expect(latestNotificationSitemap(parseSitemapIndex(fixture("bpsc-sitemap-index.xml")))).toBe(
      "https://bpsc.bihar.gov.in/bsc_notification-sitemap8.xml"
    );
  });

  it("parses notice ids and lastmod as change signals only", () => {
    const notices = parseNotificationSitemap(fixture("bpsc-notification-sitemap.xml"));
    expect(notices).toHaveLength(170);
    const last = notices.at(-1)!;
    expect(last.externalId).toBe("37910");
    expect(last.updatedAt).toBe("2026-10-12T11:32:38.000Z");
    expect(last.closesAt).toBeNull();
  });

  it("rejects non-sitemap documents", () => {
    expect(() => parseSitemapIndex("<html>blocked</html>")).toThrow(ParseError);
    expect(() => parseNotificationSitemap("<html>blocked</html>")).toThrow(ParseError);
  });
});

describe("State PSC notice-list adapters (fixtures)", () => {

  it("RPSC: dated news items with absolute official links", () => {
    const n = parseRpsc(fixture("rpsc-home.html"), "https://rpsc.rajasthan.gov.in/");
    expect(n.length).toBe(MAX_NOTICES);
    expect(n[0].title).toMatch(/^Result Preamble and Cutoff Marks/);
    expect(n[0].updatedAt).toBe("2026-10-08T18:30:00.000Z"); // 09/10/2026 IST
    expect(n[0].noticeUrl).toMatch(/^https:\/\/rpsc\.rajasthan\.gov\.in\/Static\/Result\/.+\.pdf$/);
  });

  it("PPSC: 'UPLOADED ON' date is parsed and stripped from the title", () => {
    const n = parsePpsc(fixture("ppsc-home-excerpt.html"), "https://ppsc.gov.in/");
    const auditor = n.find((x) => /JUNIOR AUDITOR/.test(x.title))!;
    expect(auditor.title).not.toMatch(/UPLOADED ON/i);
    expect(auditor.updatedAt).toBe("2026-09-30T18:30:00.000Z"); // 01-10-2026 IST
  });

  it("Kerala PSC: body PDF links only, no sidebar links", () => {
    const n = parseKeralaPsc(fixture("keralapsc-exam-updates.html"), "https://www.keralapsc.gov.in/psc-examination-updates");
    expect(n[0].title).toMatch(/^standardization procedure/);
    expect(n.every((x) => x.noticeUrl!.startsWith("https://www.keralapsc.gov.in/sites/default/files/"))).toBe(true);
    expect(n[0].updatedAt).toBeNull(); // the page states no per-item dates; none are invented
  });

  it("JPSC: press releases with uploaded dates, reports excluded", () => {
    const n = parseJpsc(fixture("jpsc-notices.html"), "https://jpsc.gov.in/uni_notice.php");
    expect(n.length).toBeGreaterThan(0);
    expect(n.some((x) => /Annual Report/.test(x.title))).toBe(false);
    expect(n[0].updatedAt).toBe("2026-07-08T18:30:00.000Z");
  });

  it("changed layouts raise ParseError instead of returning nothing silently", () => {
    expect(() => parseRpsc("<html></html>", "https://rpsc.rajasthan.gov.in/")).toThrow(ParseError);
    expect(() => parsePpsc("<html></html>", "https://ppsc.gov.in/")).toThrow(ParseError);
    expect(() => parseKeralaPsc("<html></html>", "https://www.keralapsc.gov.in/x")).toThrow(ParseError);
    expect(() => parseJpsc("<html></html>", "https://jpsc.gov.in/uni_notice.php")).toThrow(ParseError);
  });
});
