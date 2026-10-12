import { describe, it, expect } from "vitest";
import { prioritizeOpportunities, Prioritizable } from "@/domain/prioritize";
import { evaluateApplicationStatus, LifecycleState } from "@/domain/status";
import { evaluateFreshness } from "@/domain/freshness";

const now = new Date("2026-06-15T10:00:00Z");
const day = (n: number) => new Date(now.getTime() + n * 86_400_000);

function item(name: string, opts: { opensAt?: Date | null; closesAt?: Date | null; verified?: boolean; lifecycle?: LifecycleState }) {
  const period = { opensAt: "opensAt" in opts ? opts.opensAt ?? null : day(-10), closesAt: opts.closesAt ?? null };
  return {
    name,
    applicationPeriod: period,
    applicationStatus: evaluateApplicationStatus({ ...period, lifecycle: opts.lifecycle }, now),
    freshness: evaluateFreshness({ kind: "exam", lastVerifiedAt: opts.verified === false ? null : now }, now),
  } satisfies Prioritizable & { name: string };
}

describe("Deadline-first prioritisation", () => {
  const groups = prioritizeOpportunities([
    item("open-20d", { closesAt: day(20) }),
    item("soon-5d", { closesAt: day(5) }),
    item("soon-2d", { closesAt: day(2) }),
    item("open-10d", { closesAt: day(10) }),
    item("upcoming-later", { opensAt: day(9), closesAt: day(40) }),
    item("upcoming-sooner", { opensAt: day(3), closesAt: day(30) }),
    item("unverified-soon", { closesAt: day(1), verified: false }),
    item("closed", { closesAt: day(-1) }),
    item("cancelled", { closesAt: day(4), lifecycle: "CANCELLED" }),
    item("superseded", { closesAt: day(4), lifecycle: "SUPERSEDED" }),
    item("unknown", { opensAt: null, closesAt: null }),
  ]);
  const names = (xs: Array<{ name: string }>) => xs.map((x) => x.name);

  it("verified closing-soon first, earliest deadline first", () => {
    expect(names(groups.closingSoon)).toEqual(["soon-2d", "soon-5d"]);
  });

  it("other verified open next, by deadline", () => {
    expect(names(groups.open)).toEqual(["open-10d", "open-20d"]);
  });

  it("upcoming by opening date", () => {
    expect(names(groups.upcoming)).toEqual(["upcoming-sooner", "upcoming-later"]);
  });

  it("unverified items are never in the verified urgent list", () => {
    expect(names(groups.needsConfirmation)).toEqual(["unverified-soon"]);
  });

  it("closed, cancelled and superseded are excluded entirely", () => {
    const all = Object.values(groups).flat().map((x) => x.name);
    expect(all).not.toContain("closed");
    expect(all).not.toContain("cancelled");
    expect(all).not.toContain("superseded");
    expect(names(groups.unknown)).toEqual(["unknown"]);
  });
});
