import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Hours after which a missing scheduled run is reported as degraded ingestion. */
const INGESTION_STALE_HOURS = 12;

/**
 * Public health: app, database and ingestion state only. No versions, memory, env or error text.
 * Returns 503 only when the database (and therefore the site's data) is unavailable.
 */
export async function GET() {
  const started = Date.now();
  let database: { status: "connected" | "disconnected"; latencyMs: number | null } = { status: "disconnected", latencyMs: null };
  let ingestion: Record<string, unknown> = { status: "unknown" };

  try {
    const t = Date.now();
    await db.$queryRaw`SELECT 1`;
    database = { status: "connected", latencyMs: Date.now() - t };
  } catch (error) {
    console.error("[HEALTH] database ping failed:", error instanceof Error ? error.message.split("\n").pop() : error);
  }

  if (database.status === "connected") {
    try {
      const [lastRun, failingSources, enabledSources, pendingReviews] = await Promise.all([
        db.jobRun.findFirst({ where: { trigger: "SCHEDULED" }, orderBy: { startedAt: "desc" }, select: { startedAt: true, finishedAt: true } }),
        db.monitoredSource.count({ where: { enabled: true, consecutiveFailures: { gt: 0 } } }),
        db.monitoredSource.count({ where: { enabled: true } }),
        db.changeCandidate.count({ where: { state: "PENDING" } }),
      ]);
      const ageHours = lastRun ? (Date.now() - lastRun.startedAt.getTime()) / 3_600_000 : null;
      ingestion = {
        status: !lastRun || (ageHours ?? 0) > INGESTION_STALE_HOURS ? "stale" : failingSources > 0 ? "degraded" : "ok",
        lastScheduledRunAt: lastRun?.startedAt.toISOString() ?? null,
        enabledSources,
        failingSources,
        pendingReviews,
      };
    } catch {
      ingestion = { status: "unknown" };
    }
  }

  const healthy = database.status === "connected";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      app: "GovernIT",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - started,
      checks: { database, ingestion },
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
