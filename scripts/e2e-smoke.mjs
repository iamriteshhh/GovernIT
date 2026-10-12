#!/usr/bin/env node
/**
 * HTTP-level end-to-end journeys against a RUNNING server (no browser):
 *   npm run build && npx next start -p 3100   (in another terminal)
 *   E2E_BASE_URL=http://localhost:3100 npm run test:e2e
 * Options:
 *   --outage   also stops and restarts the docker Postgres to prove an outage is not shown as "empty"
 * Reads admin credentials from .env but never prints them. Mutates the dev database
 * (approves/publishes review-queue items only if --approve-pending is passed).
 */
import fs from "node:fs";
import { execSync } from "node:child_process";
import assert from "node:assert/strict";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const args = new Set(process.argv.slice(2));
const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

let passed = 0;
const failures = [];
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${e.message.split("\n")[0]}`);
  }
}

async function get(path, init = {}) {
  const res = await fetch(BASE + path, { redirect: "manual", ...init });
  return { res, text: await res.text() };
}

const count = (html, re) => (html.match(re) ?? []).length;

console.log(`E2E smoke against ${BASE}`);

await step("health reports DB connected and ingestion state", async () => {
  const { res, text } = await get("/api/health");
  assert.equal(res.status, 200);
  const j = JSON.parse(text);
  assert.equal(j.checks.database.status, "connected");
  assert.ok(j.checks.ingestion.status);
});

await step("home renders deadline-first sections with records and the no-flash theme script", async () => {
  const { res, text } = await get("/");
  assert.equal(res.status, 200);
  assert.match(text, /deadline first/);
  assert.ok(count(text, /href="\/(exams|schemes)\/[a-z0-9-]+"/g) > 0, "no opportunity links");
  const head = text.slice(0, text.indexOf("<body"));
  assert.match(head, /governit-theme/, "theme init script must run in <head>, before body paints");
  assert.match(text, /aria-label="Switch colour theme"|Switch to (light|dark) theme/, "theme toggle missing");
  assert.doesNotMatch(text, /100% Officially Verified|Zero-Fabrication Standard/);
});

for (const path of ["/exams", "/schemes", "/closing-soon", "/upcoming"]) {
  await step(`${path} renders listings (DB healthy)`, async () => {
    const { res, text } = await get(path);
    assert.equal(res.status, 200);
    assert.ok(count(text, /<article/g) > 0 || path === "/upcoming", `no cards on ${path}`);
    assert.doesNotMatch(text, /We could not load/);
  });
}

await step("/notices lists official notices linked to official hosts, with the not-reviewed disclaimer", async () => {
  const { res, text } = await get("/notices");
  assert.equal(res.status, 200);
  assert.match(text, /have not reviewed them|has not reviewed them/);
  const links = [...text.matchAll(/href="(https:\/\/[^"]+)"[^>]*>Open official notice/g)].map((m) => new URL(m[1]).hostname);
  assert.ok(links.length > 0, "no notices rendered");
  for (const h of links) assert.match(h, /(gov\.in|nic\.in)$/, `non-official notice host ${h}`);
});

await step("closed/cancelled never appear on the deadlines page", async () => {
  const { text } = await get("/closing-soon");
  assert.doesNotMatch(text, /Applications closed on|has been cancelled|Withdrawn<\/span>/);
});

await step("exam detail exposes separate apply and official-source links, and an honest verification state", async () => {
  const { res, text } = await get("/exams/upsc-cse-2026");
  assert.equal(res.status, 200);
  assert.match(text, /href="https:\/\/upsconline\.nic\.in"/);
  assert.match(text, /Official sources/);
  assert.match(text, /Not yet verified|Recently verified|Re-check due|Verification overdue/);
});

await step("unknown slug is a real 404", async () => {
  const { res } = await get("/exams/no-such-exam-xyz");
  assert.equal(res.status, 404);
});

await step("public API: listing works and admin API refuses anonymous writes", async () => {
  const list = await get("/api/exams?limit=5");
  assert.equal(list.res.status, 200);
  assert.equal(JSON.parse(list.text).data.length, 5);
  const write = await get("/api/admin/exams", { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: "{}" });
  assert.equal(write.res.status, 401);
  const cron = await get("/api/cron/check-sources");
  assert.equal(cron.res.status, 401);
});

await step("CSRF: cross-origin admin POST is rejected", async () => {
  const r = await get("/api/admin/exams", { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: "{}" });
  assert.equal(r.res.status, 403);
});

let cookie = "";
await step("admin can log in and open the sources & review page", async () => {
  const [user, pass] = (env.ADMIN_USERS ?? "").split(",")[0].split(":");
  const r = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ username: user, secretKey: pass }),
  });
  assert.equal(r.status, 200, `login failed: ${r.status}`);
  cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  assert.ok(cookie, "no session cookie");
  const page = await get("/admin/sources", { headers: { cookie } });
  assert.equal(page.res.status, 200);
  assert.match(page.text, /Source health/);
  assert.match(page.text, /Review queue/);
  assert.match(page.text, /TNPSC Exam Dashboard/);
});

if (args.has("--approve-pending")) {
  await step("review flow: approve a pending TNPSC notification and publish it with a verification note", async () => {
    const page = await get("/admin/sources", { headers: { cookie } });
    // Candidate ids are only in client props; use the API listing via the page's JSON-in-HTML.
    const m = /"id":"([a-z0-9]{20,})","kind":"NEW_OPPORTUNITY","title":"COMBINED CIVIL SERVICES EXAMINATION - IV/.exec(page.text.replace(/\\"/g, '"'));
    assert.ok(m, "Group IV candidate not pending");
    const r = await fetch(`${BASE}/api/admin/review/${m[1]}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE, cookie },
      body: JSON.stringify({ action: "approve", note: "E2E: dates match TNPSC exam dashboard row for 11/2026" }),
    });
    const j = await r.json();
    assert.equal(r.status, 200, JSON.stringify(j));
    const exam = j.entity.id;
    const pub = await fetch(`${BASE}/api/admin/exams/${exam}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", origin: BASE, cookie },
      body: JSON.stringify({ isPublished: true, verificationNote: "E2E: checked TNPSC dashboard (notification 11/2026) before publishing" }),
    });
    assert.equal(pub.status, 200);
  });
}

await step("a verified open listing (if any) shows a primary apply action and a countdown", async () => {
  const { text } = await get("/closing-soon");
  if (!/id="section-(open|closingSoon)"/.test(text)) {
    console.log("       (skipped: no verified open listings in this database)");
    return;
  }
  assert.match(text, /Open Official Application|Apply on Official Site/);
  assert.match(text, /days left|hours left today/);
  assert.match(text, /Registration closes \d{1,2} [A-Z][a-z]{2} \d{4}, \d{1,2}:\d{2} (am|pm) IST/);
});

if (args.has("--outage")) {
  await step("DB outage is shown as an error, never as an empty directory", async () => {
    execSync("docker stop governit-postgres", { stdio: "ignore" });
    try {
      const page = await get("/exams");
      assert.match(page.text, /We could not load (<!-- -->)?exams(<!-- -->)? right now/);
      assert.doesNotMatch(page.text, /No listings match these filters/);
      const api = await get("/api/exams");
      assert.equal(api.res.status, 503);
      assert.equal(JSON.parse(api.text).error, "DB_UNAVAILABLE");
      const detail = await get("/exams/upsc-cse-2026");
      assert.notEqual(detail.res.status, 404, "outage must not look like 'not found'");
      const health = await get("/api/health");
      assert.equal(health.res.status, 503);
    } finally {
      execSync("docker start governit-postgres", { stdio: "ignore" });
      for (let i = 0; i < 30; i++) {
        const ok = await fetch(`${BASE}/api/health`).then((r) => r.status === 200).catch(() => false);
        if (ok) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  });
}

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
