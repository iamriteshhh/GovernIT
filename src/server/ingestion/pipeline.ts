import { CandidateKind, CheckOutcome, JobTrigger, MonitoredSource, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/server/services/audit";
import { ADAPTERS } from "./adapters";
import { FetchBlockedError, httpStatusOf, isHostAllowed, safeFetch } from "./safe-fetch";
import { sha256 } from "./html";
import { AdapterResult, ParsedNotice, ParseError, SourceAdapter } from "./types";
import { runLinkChecks } from "./link-check";
import { createExamFromNotice } from "./create-exam";

const LOCK_MS = 5 * 60_000;
const MAX_NEW_CANDIDATES_PER_RUN = 25;
/** Consecutive failures after which an admin is asked to look at the source. */
export const FAILURE_REVIEW_THRESHOLD = 3;

export const ACTOR_PREFIX = "auto:";

type Snapshot = Record<string, string>;

export interface SourceRunSummary {
  sourceKey: string;
  outcome: CheckOutcome | "SKIPPED_LOCKED";
  itemsFound: number;
  autoApplied: number;
  noticesAdded: number;
  queued: number;
  verified: number;
  error?: string;
}

// ---------- validation of adapter output ----------

const isoOrNull = z.string().datetime().nullable();
const noticeSchema = z.object({
  externalId: z.string().min(1).max(100),
  title: z.string().min(3).max(500),
  evidenceUrl: z.string().url().startsWith("https://"),
  noticeUrl: z.string().url().nullable(),
  applyUrl: z.string().url().nullable(),
  opensAt: isoOrNull,
  closesAt: isoOrNull,
  examDate: isoOrNull,
  updatedAt: isoOrNull,
  lifecycleSignal: z.enum(["CANCELLED", "WITHDRAWN"]).nullable(),
  ambiguous: z.array(z.string()),
});

/** Domain rules on top of shape: linked URLs must stay on official hosts, windows must be sane. */
function validateNotice(n: ParsedNotice, adapter: SourceAdapter): ParsedNotice {
  const parsed = noticeSchema.parse(n);
  const ambiguous = new Set(parsed.ambiguous);
  const official = [...adapter.hosts, ...OFFICIAL_LINK_SUFFIXES];
  for (const key of ["noticeUrl", "applyUrl"] as const) {
    const url = parsed[key];
    if (url && !isHostAllowed(new URL(url).hostname, official)) {
      ambiguous.add(key);
      parsed[key] = null;
    }
  }
  if (parsed.opensAt && parsed.closesAt && Date.parse(parsed.closesAt) <= Date.parse(parsed.opensAt)) {
    ambiguous.add("closesAt");
    parsed.closesAt = null;
  }
  return { ...parsed, ambiguous: [...ambiguous] };
}

/** Official portals linked from official pages (not always under gov.in). */
export const OFFICIAL_LINK_SUFFIXES = ["gov.in", "nic.in", "tnpscexams.in"];

const fingerprintOf = (n: ParsedNotice) =>
  sha256(JSON.stringify([n.title, n.noticeUrl, n.applyUrl, n.opensAt, n.closesAt, n.examDate, n.updatedAt, n.lifecycleSignal]));

function sanitizeError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  // Never persist query strings (could carry tokens) or long stacks.
  return msg.replace(/\?[^\s"']*/g, "?…").slice(0, 300);
}

function outcomeForError(error: unknown): CheckOutcome {
  if (error instanceof ParseError || error instanceof z.ZodError) return "PARSE_FAILED";
  const status = httpStatusOf(error);
  if (error instanceof FetchBlockedError || status === 401 || status === 403 || status === 451) return "BLOCKED";
  return "FETCH_FAILED";
}

// ---------- locking ----------

async function acquireLock(sourceId: string, now: Date): Promise<boolean> {
  const { count } = await db.monitoredSource.updateMany({
    where: { id: sourceId, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
    data: { lockedUntil: new Date(now.getTime() + LOCK_MS) },
  });
  return count === 1;
}

const releaseLock = (sourceId: string) =>
  db.monitoredSource.update({ where: { id: sourceId }, data: { lockedUntil: null } }).catch(() => undefined);

// ---------- candidates ----------

async function queueCandidate(
  data: {
    source: MonitoredSource;
    checkId: string;
    kind: CandidateKind;
    externalId: string | null;
    title: string;
    evidenceUrl: string | null;
    proposed: Record<string, unknown>;
    current?: Record<string, unknown> | null;
    reason: string;
    examId?: string | null;
    fingerprintParts: unknown[];
  }
): Promise<boolean> {
  const fingerprint = sha256(JSON.stringify([data.source.key, data.kind, data.externalId, ...data.fingerprintParts]));
  const existing = await db.changeCandidate.findUnique({ where: { fingerprint }, select: { id: true } });
  if (existing) return false;
  await db.changeCandidate.create({
    data: {
      sourceId: data.source.id,
      checkId: data.checkId,
      kind: data.kind,
      externalId: data.externalId,
      title: data.title,
      evidenceUrl: data.evidenceUrl,
      proposed: data.proposed as Prisma.InputJsonValue,
      current: (data.current ?? undefined) as Prisma.InputJsonValue | undefined,
      reason: data.reason,
      examId: data.examId ?? null,
      fingerprint,
    },
  });
  return true;
}

// ---------- compare + apply ----------

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

interface CompareStats {
  autoApplied: number;
  /** New rows in the public official-notices feed. */
  noticesAdded: number;
  queued: number;
  verified: number;
  changes: string[];
}

async function processOpportunityNotice(
  source: MonitoredSource,
  adapter: SourceAdapter,
  checkId: string,
  notice: ParsedNotice,
  stats: CompareStats,
  budget: { remaining: number }
) {
  const externalRef = `${source.key}:${notice.externalId}`;
  const exam = await db.exam.findUnique({
    where: { externalRef },
    include: { applicationPeriod: true, sources: true },
  });

  if (!exam) {
    // Auto-publish only complete, unambiguous official data from sources marked as safe for it.
    const clean = notice.ambiguous.length === 0 && !notice.lifecycleSignal && Boolean(notice.closesAt || notice.examDate);
    if (source.autoPublish && clean) {
      const actor = `${ACTOR_PREFIX}${adapter.id}@${adapter.version}`;
      await db.$transaction(async (tx) => {
        const created = await createExamFromNotice(
          tx,
          source,
          { ...notice, stateCode: adapter.stateCode },
          { publish: true, verifiedBy: actor, verificationNote: `Created from official source: ${notice.evidenceUrl}` }
        );
        // Any earlier review item for the same notice is now settled.
        await tx.changeCandidate.updateMany({
          where: { sourceId: source.id, externalId: notice.externalId, kind: "NEW_OPPORTUNITY", state: "PENDING" },
          data: { state: "AUTO_APPLIED", reviewedBy: actor, reviewedAt: new Date(), reviewNote: "Auto-published from official source" },
        });
        await writeAudit(
          { actor, action: "exam.autopublish", entityType: "exam", entityId: created.id, changes: { externalRef: created.externalRef, evidence: notice.evidenceUrl } },
          tx
        );
      });
      stats.autoApplied++;
      stats.changes.push(`published: ${notice.externalId}`);
      return;
    }
    if (budget.remaining <= 0) return;
    const queued = await queueCandidate({
      source,
      checkId,
      kind: "NEW_OPPORTUNITY",
      externalId: notice.externalId,
      title: notice.title,
      evidenceUrl: notice.evidenceUrl,
      proposed: { ...notice, stateCode: adapter.stateCode },
      reason: "New notification on the official source. Review the evidence, then approve to create an unpublished draft.",
      fingerprintParts: [fingerprintOf(notice)],
    });
    if (queued) {
      budget.remaining--;
      stats.queued++;
      stats.changes.push(`new: ${notice.externalId}`);
    }
    return;
  }

  const current = {
    opensAt: iso(exam.applicationPeriod?.opensAt),
    closesAt: iso(exam.applicationPeriod?.closesAt),
    examDate: iso(exam.examDate),
    officialApplyUrl: exam.officialApplyUrl,
    lifecycle: exam.lifecycle,
  };
  const proposedFields = {
    opensAt: notice.opensAt,
    closesAt: notice.closesAt,
    examDate: notice.examDate,
    officialApplyUrl: notice.applyUrl,
  };

  const autoFill: Record<string, string> = {};
  const conflicts: Record<string, { current: string | null; proposed: string | null }> = {};

  for (const [field, proposed] of Object.entries(proposedFields) as Array<[keyof typeof proposedFields, string | null]>) {
    if (notice.ambiguous.includes(field === "officialApplyUrl" ? "applyUrl" : field)) {
      conflicts[field] = { current: current[field], proposed: null };
      continue;
    }
    if (proposed === null) continue; // the source not stating a value is never a removal
    if (current[field] === null) autoFill[field] = proposed; // deterministic: fill an empty field from the official source
    else if (current[field] !== proposed) conflicts[field] = { current: current[field], proposed };
  }

  if (notice.lifecycleSignal && exam.lifecycle === "ACTIVE") {
    if (await queueCandidate({
      source, checkId, kind: "STATUS_CHANGE", externalId: notice.externalId, title: notice.title,
      evidenceUrl: notice.evidenceUrl, examId: exam.id,
      proposed: { lifecycle: notice.lifecycleSignal }, current: { lifecycle: exam.lifecycle },
      reason: `Official page mentions "${notice.lifecycleSignal.toLowerCase()}". Confirm in the official notice before changing status.`,
      fingerprintParts: [notice.lifecycleSignal],
    })) stats.queued++;
  }

  if (Object.keys(autoFill).length > 0) {
    await db.$transaction(async (tx) => {
      const { opensAt, closesAt, examDate, officialApplyUrl } = autoFill;
      const period = { ...(opensAt ? { opensAt: new Date(opensAt) } : {}), ...(closesAt ? { closesAt: new Date(closesAt) } : {}) };
      await tx.exam.update({
        where: { id: exam.id },
        data: {
          ...(examDate ? { examDate: new Date(examDate) } : {}),
          ...(officialApplyUrl ? { officialApplyUrl } : {}),
          ...(Object.keys(period).length
            ? { applicationPeriod: { upsert: { create: { opensAt: period.opensAt ?? null, closesAt: period.closesAt ?? null }, update: period } } }
            : {}),
        },
      });
      const fingerprint = sha256(JSON.stringify([source.key, "AUTO_FILL", notice.externalId, autoFill]));
      await tx.changeCandidate.upsert({
        where: { fingerprint },
        update: {},
        create: {
          sourceId: source.id, checkId, kind: "DATE_CHANGE", state: "AUTO_APPLIED", externalId: notice.externalId,
          title: notice.title, evidenceUrl: notice.evidenceUrl, examId: exam.id,
          proposed: autoFill, current: Object.fromEntries(Object.keys(autoFill).map((k) => [k, null])),
          reason: "Filled empty fields from the official source (deterministic rule).",
          reviewedBy: `${ACTOR_PREFIX}${adapter.id}@${adapter.version}`, reviewedAt: new Date(), fingerprint,
        },
      });
      await writeAudit(
        { actor: `${ACTOR_PREFIX}${adapter.id}@${adapter.version}`, action: "exam.autofill", entityType: "exam", entityId: exam.id,
          changes: { ...Object.fromEntries(Object.entries(autoFill).map(([k, v]) => [k, { from: null, to: v }])), evidence: notice.evidenceUrl } },
        tx
      );
    });
    stats.autoApplied += Object.keys(autoFill).length;
    stats.changes.push(`autofill ${notice.externalId}: ${Object.keys(autoFill).join(",")}`);
  }

  if (Object.keys(conflicts).length > 0) {
    const kind: CandidateKind = Object.keys(conflicts).every((k) => k === "officialApplyUrl") ? "LINK_CHANGE" : "DATE_CHANGE";
    if (await queueCandidate({
      source, checkId, kind, externalId: notice.externalId, title: notice.title, evidenceUrl: notice.evidenceUrl, examId: exam.id,
      proposed: Object.fromEntries(Object.entries(conflicts).map(([k, v]) => [k, v.proposed])),
      current: Object.fromEntries(Object.entries(conflicts).map(([k, v]) => [k, v.current])),
      reason: notice.ambiguous.length
        ? `Official page could not be read unambiguously for: ${notice.ambiguous.join(", ")}.`
        : "Official source differs from the published record.",
      fingerprintParts: [conflicts],
    })) {
      stats.queued++;
      stats.changes.push(`conflict ${notice.externalId}: ${Object.keys(conflicts).join(",")}`);
    }
    return; // a record with an open conflict is not re-verified
  }

  // Everything the source states now matches the record: that is real evidence, so record it.
  const confirmed = Object.entries(proposedFields).filter(([, v]) => v !== null).map(([k]) => k);
  if (confirmed.length > 0 && !notice.lifecycleSignal) {
    const verifiedBy = `${ACTOR_PREFIX}${adapter.id}@${adapter.version}`;
    const notes = `Matched official source (${confirmed.join(", ")}): ${notice.evidenceUrl}`;
    const last = await db.verification.findFirst({ where: { examId: exam.id }, orderBy: { verifiedAt: "desc" } });
    // Same automated confirmation as last time: move its timestamp instead of adding a duplicate row.
    if (last && last.verifiedBy === verifiedBy && last.notes === notes) {
      await db.verification.update({ where: { id: last.id }, data: { verifiedAt: new Date() } });
    } else {
      await db.verification.create({ data: { examId: exam.id, verifiedBy, notes } });
    }
    stats.verified++;
  }
}

/**
 * Signal sources feed the public "Latest official notices" list: the official title, link and
 * stated date only. Nothing about an opportunity's status is inferred from them.
 */
async function processSignalNotices(source: MonitoredSource, notices: ParsedNotice[], stats: CompareStats, now: Date) {
  const existing = new Set(
    (await db.officialNotice.findMany({ where: { sourceId: source.id, externalId: { in: notices.map((n) => n.externalId) } }, select: { externalId: true } }))
      .map((r) => r.externalId)
  );
  for (const n of notices) {
    const data = { title: n.title, url: n.noticeUrl ?? n.evidenceUrl, publishedOn: n.updatedAt ? new Date(n.updatedAt) : null };
    await db.officialNotice.upsert({
      where: { sourceId_externalId: { sourceId: source.id, externalId: n.externalId } },
      create: { sourceId: source.id, externalId: n.externalId, ...data, firstSeenAt: now, lastSeenAt: now },
      update: { ...data, lastSeenAt: now },
    });
    if (!existing.has(n.externalId)) stats.noticesAdded++;
  }
  if (stats.noticesAdded > 0) stats.changes.push(`${stats.noticesAdded} new official notices`);
}

// ---------- one source ----------

export interface RunOptions {
  /** Injected fetcher (tests use fixtures). Defaults to the SSRF-safe network fetcher. */
  fetcher?: typeof safeFetch;
  jobRunId?: string | null;
  now?: Date;
}

export async function runSourceCheck(sourceId: string, options: RunOptions = {}): Promise<SourceRunSummary> {
  const now = options.now ?? new Date();
  const source = await db.monitoredSource.findUniqueOrThrow({ where: { id: sourceId } });
  const summary: SourceRunSummary = { sourceKey: source.key, outcome: "SKIPPED_LOCKED", itemsFound: 0, autoApplied: 0, noticesAdded: 0, queued: 0, verified: 0 };

  if (!(await acquireLock(source.id, now))) return summary;

  const check = await db.sourceCheck.create({
    data: { sourceId: source.id, jobRunId: options.jobRunId ?? null, startedAt: now },
  });
  const stats: CompareStats = { autoApplied: 0, noticesAdded: 0, queued: 0, verified: 0, changes: [] };
  const fetcher = options.fetcher ?? safeFetch;

  try {
    const adapter = ADAPTERS[source.adapterId];
    if (!adapter) throw new ParseError(`No adapter registered for "${source.adapterId}"`);
    const allowedHosts = [source.allowedHost, ...adapter.hosts];

    const result: AdapterResult = await adapter.run({
      source: { url: source.url, allowedHost: source.allowedHost, etag: source.etag, lastModified: source.lastModified },
      fetch: (url, opts) =>
        fetcher(url, { allowedHosts, etag: source.etag, lastModified: source.lastModified, ...opts }),
    });

    const previous = (source.snapshot as Snapshot | null) ?? null;
    let outcome: CheckOutcome = "NOT_MODIFIED";
    let snapshot: Snapshot | null = previous;

    // Opportunity sources are re-compared every run so matching records get re-confirmed;
    // signal sources skip work when the document is byte-identical.
    if (!result.notModified && (adapter.mode === "opportunities" || result.contentHash !== source.contentHash)) {
      const notices = result.notices.map((n) => validateNotice(n, adapter));
      // A sudden empty or collapsed parse means the layout changed: keep the last known good data.
      if (previous && Object.keys(previous).length >= 5 && notices.length < Object.keys(previous).length / 2) {
        throw new ParseError(`Parsed ${notices.length} notices, previously ${Object.keys(previous).length}: layout change suspected`);
      }
      summary.itemsFound = notices.length;
      const budget = { remaining: MAX_NEW_CANDIDATES_PER_RUN };

      if (adapter.mode === "opportunities") {
        for (const n of notices) await processOpportunityNotice(source, adapter, check.id, n, stats, budget);
      } else {
        await processSignalNotices(source, notices, stats, now);
      }
      snapshot = Object.fromEntries(notices.map((n) => [n.externalId, fingerprintOf(n)]));
      outcome = stats.queued + stats.autoApplied + stats.noticesAdded > 0 ? "CHANGED" : "UNCHANGED";
    } else if (!result.notModified) {
      outcome = "UNCHANGED";
    }

    await db.$transaction([
      db.sourceCheck.update({
        where: { id: check.id },
        data: {
          finishedAt: new Date(),
          outcome,
          httpStatus: result.http.status,
          finalUrl: result.http.finalUrl,
          etag: result.http.etag,
          lastModified: result.http.lastModified,
          parserVersion: `${adapter.id}@${adapter.version}`,
          itemsFound: summary.itemsFound,
          changeSummary: stats.changes.slice(0, 50).join("; ") || null,
        },
      }),
      db.monitoredSource.update({
        where: { id: source.id },
        data: {
          lastAttemptAt: now,
          lastSuccessAt: now,
          lastOutcome: outcome,
          lastError: null,
          consecutiveFailures: 0,
          nextCheckAt: new Date(now.getTime() + source.checkIntervalMinutes * 60_000),
          etag: result.http.etag ?? source.etag,
          lastModified: result.http.lastModified ?? source.lastModified,
          contentHash: result.contentHash ?? source.contentHash,
          adapterVersion: adapter.version,
          ...(snapshot !== previous ? { snapshot: snapshot as Prisma.InputJsonValue, lastContentChangeAt: now } : {}),
        },
      }),
    ]);

    Object.assign(summary, { outcome, autoApplied: stats.autoApplied, noticesAdded: stats.noticesAdded, queued: stats.queued, verified: stats.verified });
    return summary;
  } catch (error) {
    const outcome = outcomeForError(error);
    const message = sanitizeError(error);
    const failures = source.consecutiveFailures + 1;
    const retryMinutes = Math.min(source.checkIntervalMinutes, 15 * 2 ** (failures - 1));

    await db.$transaction([
      db.sourceCheck.update({
        where: { id: check.id },
        data: { finishedAt: new Date(), outcome, error: message, httpStatus: httpStatusOf(error) },
      }),
      // Last known good etag/hash/snapshot and every opportunity record stay untouched.
      db.monitoredSource.update({
        where: { id: source.id },
        data: {
          lastAttemptAt: now,
          lastOutcome: outcome,
          lastError: message,
          consecutiveFailures: failures,
          nextCheckAt: new Date(now.getTime() + retryMinutes * 60_000),
        },
      }),
    ]);

    if (failures >= FAILURE_REVIEW_THRESHOLD || outcome === "PARSE_FAILED" || outcome === "BLOCKED") {
      await queueCandidate({
        source, checkId: check.id, kind: "PARSER_FAILURE", externalId: null,
        title: `${source.name}: ${outcome.replace("_", " ").toLowerCase()}`,
        evidenceUrl: source.url,
        proposed: { outcome, error: message, consecutiveFailures: failures },
        reason:
          outcome === "BLOCKED"
            ? "The source refused automated access or is outside the allowlist. Verify listings manually; do not bypass access controls."
            : "Automated checks keep failing. Listings keep their last verified data and will show as overdue until checked.",
        fingerprintParts: [outcome, now.toISOString().slice(0, 10)],
      }).catch(() => undefined);
    }

    Object.assign(summary, { outcome, error: message });
    return summary;
  } finally {
    await releaseLock(source.id);
  }
}

// ---------- scheduled run ----------

export interface JobOptions extends RunOptions {
  trigger: JobTrigger;
  /** Only these sources (manual "Check now"); otherwise every enabled source that is due. */
  sourceIds?: string[];
  maxSources?: number;
  budgetMs?: number;
  linkChecks?: number;
}

export async function runSourceJob(options: JobOptions) {
  const started = Date.now();
  const budgetMs = options.budgetMs ?? 50_000;
  const now = options.now ?? new Date();
  const job = await db.jobRun.create({ data: { trigger: options.trigger, startedAt: now } });

  const sources = await db.monitoredSource.findMany({
    where: options.sourceIds
      ? { id: { in: options.sourceIds }, enabled: true }
      : { enabled: true, OR: [{ nextCheckAt: null }, { nextCheckAt: { lte: now } }] },
    orderBy: { nextCheckAt: { sort: "asc", nulls: "first" } },
    take: options.maxSources ?? 5,
  });

  const results: SourceRunSummary[] = [];
  for (const s of sources) {
    if (Date.now() - started > budgetMs) break;
    results.push(await runSourceCheck(s.id, { ...options, jobRunId: job.id }));
  }

  const remaining = budgetMs - (Date.now() - started);
  const links =
    options.linkChecks === 0 || remaining < 10_000
      ? { checked: 0, queued: 0 }
      : await runLinkChecks({ limit: options.linkChecks ?? 5, fetcher: options.fetcher, now });

  const attempted = results.filter((r) => r.outcome !== "SKIPPED_LOCKED");
  const failed = attempted.filter((r) => ["FETCH_FAILED", "PARSE_FAILED", "BLOCKED"].includes(r.outcome));
  const updated = await db.jobRun.update({
    where: { id: job.id },
    data: {
      finishedAt: new Date(),
      sourcesAttempted: attempted.length,
      sourcesSucceeded: attempted.length - failed.length,
      sourcesFailed: failed.length,
      reviewsQueued: attempted.reduce((n, r) => n + r.queued, 0) + links.queued,
      linksChecked: links.checked,
      note: sources.length === 0 ? "No sources due" : null,
    },
  });

  console.info(
    `[SOURCE JOB] ${updated.id} trigger=${options.trigger} attempted=${updated.sourcesAttempted} failed=${updated.sourcesFailed} queued=${updated.reviewsQueued} links=${updated.linksChecked}`
  );
  return { job: updated, results };
}
