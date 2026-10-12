import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Computes real WCAG 2.x contrast ratios from the design tokens in globals.css, for both themes.
 * Every text/background pair the UI uses must reach AA for normal text (4.5:1).
 */
const css = fs.readFileSync(path.join(__dirname, "../../src/app/globals.css"), "utf8");

function tokens(selector: RegExp): Record<string, string> {
  const block = selector.exec(css)?.[1] ?? "";
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

const light = tokens(/:root\s*\{([\s\S]*?)\}/);
const dark = { ...light, ...tokens(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\}/) };

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const PAIRS: Array<[string, string]> = [
  ["fg", "background"],
  ["fg", "surface"],
  ["fg", "surface-muted"],
  ["muted", "background"],
  ["muted", "surface"],
  ["muted", "surface-muted"],
  ["primary-fg", "primary"],
  ["primary-fg", "primary-hover"],
  ["link", "surface"],
  ["link", "background"],
  ["link", "surface-muted"],
  ["info", "info-bg"],
  ["urgent", "urgent-bg"],
  ["urgent", "surface"],
  ["success", "success-bg"],
  ["success", "surface"],
  ["danger", "danger-bg"],
];

describe("WCAG AA contrast of design tokens", () => {
  it("defines the tokens in both themes", () => {
    expect(Object.keys(light).length).toBeGreaterThan(15);
    expect(dark.background).not.toBe(light.background);
  });

  for (const [theme, t] of [["light", light], ["dark", dark]] as const) {
    it.each(PAIRS)(`${theme}: %s on %s >= 4.5:1`, (fg, bg) => {
      expect(t[fg], `missing --${fg}`).toBeTruthy();
      expect(t[bg], `missing --${bg}`).toBeTruthy();
      expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
    });

    it(`${theme}: focus ring is visible against the page (>= 3:1)`, () => {
      expect(contrast(t.focus, t.background)).toBeGreaterThanOrEqual(3);
    });
  }
});
