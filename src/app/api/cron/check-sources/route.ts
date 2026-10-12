import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runSourceJob } from "@/server/ingestion/pipeline";
import { apiFailure } from "@/server/services/load";

export const dynamic = "force-dynamic";
// Long enough for a bounded run; the job itself stops at its own time budget.
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const given = crypto.createHash("sha256").update(header.slice(7)).digest();
  const expected = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(given, expected);
}

/**
 * Scheduled entry point: hosted cron (GET with "Authorization: Bearer $CRON_SECRET") or any
 * scheduler that can send that header. Idempotent and overlap-safe (per-source DB locks).
 */
async function handle(request: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "Scheduled checks are not configured (CRON_SECRET unset)" }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { job, results } = await runSourceJob({ trigger: "SCHEDULED", budgetMs: 50_000 });
    return NextResponse.json({
      jobRunId: job.id,
      attempted: job.sourcesAttempted,
      succeeded: job.sourcesSucceeded,
      failed: job.sourcesFailed,
      reviewsQueued: job.reviewsQueued,
      linksChecked: job.linksChecked,
      sources: results.map((r) => ({ key: r.sourceKey, outcome: r.outcome, queued: r.queued, verified: r.verified })),
    });
  } catch (error) {
    return apiFailure("CRON_CHECK_SOURCES", error);
  }
}

export const GET = handle;
export const POST = handle;
