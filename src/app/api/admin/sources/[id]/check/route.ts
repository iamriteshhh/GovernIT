import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { db } from "@/lib/db";
import { runSourceJob } from "@/server/ingestion/pipeline";
import { apiFailure } from "@/server/services/load";
import { writeAudit } from "@/server/services/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Minimum gap between manual checks of one source, to stay polite to official servers. */
const MANUAL_COOLDOWN_MS = 2 * 60_000;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const { id } = await params;
    const source = await db.monitoredSource.findUnique({ where: { id } });
    if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

    const sinceLast = source.lastAttemptAt ? Date.now() - source.lastAttemptAt.getTime() : Infinity;
    if (sinceLast < MANUAL_COOLDOWN_MS) {
      const retryAfter = Math.ceil((MANUAL_COOLDOWN_MS - sinceLast) / 1000);
      return NextResponse.json(
        { error: `Checked very recently. Try again in ${retryAfter} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const actor = session.username || "admin";
    const { job, results } = await runSourceJob({ trigger: "MANUAL", sourceIds: [id], linkChecks: 0, budgetMs: 50_000 });
    await writeAudit({ actor, action: "source.check_now", entityType: "monitored_source", entityId: id, changes: { jobRunId: job.id } });
    return NextResponse.json({ jobRunId: job.id, result: results[0] ?? null });
  } catch (error) {
    return apiFailure("ADMIN_SOURCE_CHECK", error);
  }
}
