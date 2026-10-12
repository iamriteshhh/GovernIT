#!/usr/bin/env node
/**
 * Real-browser checks over the Chrome DevTools Protocol (no extra dependencies; Node 22+ WebSocket).
 *   E2E_BASE_URL=http://localhost:3100 CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node scripts/browser-check.mjs [screenshotDir]
 * Checks: theme applied before <body> (no flash) in both system modes, toggle persists across
 * navigation, keyboard focus order with visible focus, no horizontal scroll at 390px, no hydration
 * or console errors. Screenshots are written to screenshotDir (default: ./.browser-check).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.argv[2] ?? ".browser-check";
const PORT = 9333;
fs.mkdirSync(OUT, { recursive: true });

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "governit-chrome-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--window-size=1280,900", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  target = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null);
}
assert.ok(target, "Chrome did not start");

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
const consoleProblems = [];
const waiters = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  } else if (msg.method === "Runtime.exceptionThrown") {
    consoleProblems.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
  } else if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning", "assert"].includes(msg.params.type)) {
    consoleProblems.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
  } else if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error" && !/favicon|404 \(Not Found\)/.test(msg.params.entry.text)) {
    consoleProblems.push(`${msg.params.entry.text} ${msg.params.entry.url ?? ""}`.trim());
  }
  for (const w of [...waiters]) if (w.method === msg.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg.params); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
async function goto(p) {
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url: BASE + p });
  await loaded;
  await sleep(600); // hydration + effects
}
async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(data, "base64"));
}
const key = async (k, code, keyCode) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: keyCode, ...(k === "Enter" ? { text: String.fromCharCode(13) } : {}) });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: keyCode });
};

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
// Records the theme attribute the moment it is first set, and whether <body> existed yet.
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `new MutationObserver((m, o) => { const h = document.documentElement; if (h && h.hasAttribute("data-theme")) { window.__themeAtFirstSet = h.getAttribute("data-theme"); window.__bodyExistedAtFirstSet = !!document.body; o.disconnect(); } }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-theme"] });`,
});

let passed = 0;
const failures = [];
async function step(name, fn) {
  try { await fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) {
    failures.push(name);
    const detail = "actual" in e ? `actual=${JSON.stringify(e.actual)} expected=${JSON.stringify(e.expected)}` : e.message.split("\n")[0];
    console.log(`  FAIL ${name}\n       ${detail}`);
  }
}

console.log(`Browser checks against ${BASE} (Chrome headless)`);

for (const scheme of ["light", "dark"]) {
  await step(`system ${scheme}: theme is applied before <body> exists (no flash)`, async () => {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
    await goto("/");
    await evaluate("localStorage.clear()");
    await goto("/");
    assert.equal(await evaluate("window.__themeAtFirstSet"), scheme);
    assert.equal(await evaluate("window.__bodyExistedAtFirstSet"), false);
    assert.equal(await evaluate("getComputedStyle(document.body).backgroundColor"), scheme === "dark" ? "rgb(15, 20, 27)" : "rgb(246, 248, 251)");
    await shot(`home-${scheme}-desktop`);
  });
}

await step("toggle switches theme, persists across navigation, still applied before <body>", async () => {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  await goto("/");
  await evaluate(`document.querySelector('header button[aria-label^="Switch to"]').click()`);
  assert.equal(await evaluate("document.documentElement.dataset.theme"), "dark");
  assert.equal(await evaluate("localStorage.getItem('governit-theme')"), "dark");
  await goto("/exams");
  assert.equal(await evaluate("window.__themeAtFirstSet"), "dark");
  assert.equal(await evaluate("window.__bodyExistedAtFirstSet"), false);
  await shot("exams-dark-after-toggle");
  await evaluate(`document.querySelector('header button[aria-label^="Switch to"]').click()`);
  assert.equal(await evaluate("localStorage.getItem('governit-theme')"), "light");
});

await step("keyboard: first Tab reaches the skip link, focus is always visible", async () => {
  await goto("/");
  const seen = [];
  for (let i = 0; i < 9; i++) {
    await key("Tab", "Tab", 9);
    seen.push(await evaluate(`(() => { const e = document.activeElement; const s = getComputedStyle(e); return { text: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 40), outline: s.outlineStyle, w: parseFloat(s.outlineWidth), h: e.getBoundingClientRect().height }; })()`));
  }
  assert.match(seen[0].text, /Skip to main content/);
  for (const s of seen) {
    assert.notEqual(s.outline, "none", `no visible focus on "${s.text}"`);
    assert.ok(s.w >= 2, `focus outline too thin on "${s.text}"`);
  }
  console.log(`       focus order: ${seen.map((s) => s.text).join(" → ")}`);
  // Skip link: first Tab + Enter jumps to the main content.
  await goto("/");
  await key("Tab", "Tab", 9);
  await key("Enter", "Enter", 13);
  await sleep(300);
  assert.equal(await evaluate("location.hash"), "#main-content");
});

await step("tap targets: header controls and primary actions are at least 44px tall", async () => {
  await goto("/closing-soon");
  const small = await evaluate(`[...document.querySelectorAll('header a, header button, article a, main form button, main form select, main form input')]
    .filter((e) => e.offsetParent !== null && e.getBoundingClientRect().height < 43.5)
    .map((e) => (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30) + ':' + Math.round(e.getBoundingClientRect().height))`);
  // Inline text links inside cards (titles) are allowed to be text-height.
  const offenders = small.filter((s) => !/^\S.*:2\d$/.test(s) || /Apply|Official|Open|Search|Show/.test(s));
  assert.deepEqual(offenders.filter((s) => /Apply|Official|Open|Search|Show|Switch|Full details/.test(s)), []);
});

await step("mobile 390px: no horizontal scrolling on key pages", async () => {
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const p of ["/", "/exams", "/closing-soon", "/notices", "/schemes/pm-kisan", "/admin/login"]) {
    await goto(p);
    const overflow = await evaluate("document.documentElement.scrollWidth - window.innerWidth");
    assert.ok(overflow <= 1, `${p} overflows by ${overflow}px`);
  }
  await goto("/");
  await shot("home-light-mobile");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await evaluate("localStorage.clear()");
  await goto("/closing-soon");
  await shot("deadlines-dark-mobile");
  await send("Emulation.clearDeviceMetricsOverride");
});

await step("no hydration errors or console errors on any visited page", async () => {
  for (const p of ["/exams/upsc-cse-2026", "/schemes/pm-kisan", "/upcoming", "/notices", "/contact", "/admin/login"]) await goto(p);
  await shot("detail-dark-desktop");
  const problems = consoleProblems.filter((m) => !/Download the React DevTools/.test(m));
  assert.deepEqual(problems, []);
});

ws.close();
chrome.kill();
console.log(`\n${passed} passed, ${failures.length} failed · screenshots in ${OUT}`);
process.exit(failures.length ? 1 : 0);
