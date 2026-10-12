/**
 * Scheduled-script entry point (cron / Windows Task Scheduler / container scheduler):
 *   npm run sources:check            -> every enabled source that is due
 *   npm run sources:check -- --all   -> every enabled source now (still lock-protected)
 * Exit code 0 when the run completed (even if some sources failed: failures are recorded), 1 on crash.
 */
import { PrismaClient } from "@prisma/client";
import { runSourceJob } from "../src/server/ingestion/pipeline";
import { registerSources } from "../src/server/ingestion/registry";

async function main() {
  const client = new PrismaClient();
  await registerSources(client);
  const all = process.argv.includes("--all");
  const ids = all ? (await client.monitoredSource.findMany({ where: { enabled: true }, select: { id: true } })).map((s) => s.id) : undefined;
  await client.$disconnect();

  const { job, results } = await runSourceJob({ trigger: "SCHEDULED", sourceIds: ids, maxSources: 20, budgetMs: 5 * 60_000, linkChecks: 10 });
  for (const r of results) {
    console.log(`${r.sourceKey}: ${r.outcome} items=${r.itemsFound} queued=${r.queued} published/filled=${r.autoApplied} newNotices=${r.noticesAdded} verified=${r.verified}${r.error ? ` error=${r.error}` : ""}`);
  }
  console.log(`job ${job.id}: attempted=${job.sourcesAttempted} failed=${job.sourcesFailed} reviewsQueued=${job.reviewsQueued} linksChecked=${job.linksChecked}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("sources:check crashed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
