import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { db } from "@/lib/db";
import { examService } from "@/server/services/exam-service";
import { schemeService } from "@/server/services/scheme-service";
import { formatDateTimeIST } from "@/lib/dates";
import { SourceCheckButton, ReviewCard } from "@/components/admin/SourcesConsole";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sources & Review (Admin)", robots: { index: false, follow: false } };

const when = (d: Date | null | undefined) => (d ? formatDateTimeIST(d) : "never");

export default async function SourcesAdminPage() {
  const session = await getAuthenticatedAdmin();
  if (!session.isAuthenticated) redirect("/admin/login");

  const [sources, pending, recentChecks, lastJob, linkProblems, recentAudit, exams, schemes] = await Promise.all([
    db.monitoredSource.findMany({ orderBy: { name: "asc" } }),
    db.changeCandidate.findMany({
      where: { state: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { source: { select: { name: true } }, exam: { select: { name: true, slug: true } }, scheme: { select: { name: true, slug: true } } },
    }),
    db.sourceCheck.findMany({ orderBy: { startedAt: "desc" }, take: 15, include: { source: { select: { name: true } } } }),
    db.jobRun.findFirst({ orderBy: { startedAt: "desc" } }),
    db.linkCheck.findMany({ where: { OR: [{ consecutiveFailures: { gt: 0 } }, { lastResult: { in: ["BLOCKED", "NOT_ALLOWED"] } }] }, orderBy: { consecutiveFailures: "desc" }, take: 20 }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    examService.listActiveCandidates(),
    schemeService.listActiveCandidates(),
  ]);

  const staleItems = [...exams, ...schemes].filter((i) => !i.freshness.trustworthy);
  const failing = sources.filter((s) => s.consecutiveFailures > 0);
  const th = "px-3 py-2 text-left text-sm font-semibold text-muted";
  const td = "px-3 py-2 align-top text-sm text-fg";

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <Link href="/admin" className="inline-flex min-h-11 items-center gap-1.5 text-base font-semibold text-link hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Admin console
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-fg">Official sources &amp; review queue</h1>
        <p className="mt-1 max-w-3xl text-base text-muted">
          Automated checks only read approved official sources. Nothing ambiguous is published without a reviewer. A failed check
          never closes or deletes a listing.
        </p>
      </div>

      <section aria-labelledby="summary" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <h2 id="summary" className="sr-only">Summary</h2>
        {[
          { label: "Last job run", value: lastJob ? when(lastJob.startedAt) : "never", sub: lastJob ? `${lastJob.trigger.toLowerCase()} · ${lastJob.sourcesSucceeded}/${lastJob.sourcesAttempted} ok · ${lastJob.linksChecked} links` : "" },
          { label: "Sources", value: String(sources.length), sub: `${sources.filter((s) => s.enabled).length} enabled` },
          { label: "Failing sources", value: String(failing.length), sub: failing.map((s) => s.name).join(", ") || "none" },
          { label: "Pending reviews", value: String(pending.length), sub: "oldest first" },
          { label: "Listings needing confirmation", value: String(staleItems.length), sub: "unverified or overdue" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-muted">{c.label}</p>
            <p className="mt-1 text-xl font-bold text-fg">{c.value}</p>
            <p className="mt-1 text-sm text-muted">{c.sub}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="sources-h">
        <h2 id="sources-h" className="text-2xl font-bold text-fg">Source health</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[900px]">
            <thead className="bg-surface-muted">
              <tr>
                <th className={th}>Source</th>
                <th className={th}>Adapter</th>
                <th className={th}>Last attempt</th>
                <th className={th}>Last success</th>
                <th className={th}>Result</th>
                <th className={th}>Next check</th>
                <th className={th}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sources.map((s) => (
                <tr key={s.id}>
                  <td className={td}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-link underline">{s.name}</a>
                    <div className="text-muted">{s.organization}{s.enabled ? "" : " · disabled"}</div>
                  </td>
                  <td className={td}>{s.adapterId}@{s.adapterVersion}<div className="text-muted">every {s.checkIntervalMinutes} min</div></td>
                  <td className={td}>{when(s.lastAttemptAt)}</td>
                  <td className={td}>{when(s.lastSuccessAt)}</td>
                  <td className={td}>
                    <span className={s.consecutiveFailures > 0 ? "font-semibold text-danger" : "text-fg"}>{s.lastOutcome ?? "not run"}</span>
                    {s.consecutiveFailures > 0 && <div className="text-danger">{s.consecutiveFailures} failures in a row</div>}
                    {s.lastError && <div className="max-w-xs break-words text-muted">{s.lastError}</div>}
                  </td>
                  <td className={td}>{when(s.nextCheckAt)}</td>
                  <td className={td}><SourceCheckButton id={s.id} name={s.name} /></td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr><td className={td} colSpan={7}>No sources registered. Run <code>npm run db:seed</code> or <code>npm run sources:register</code>.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="queue-h">
        <h2 id="queue-h" className="text-2xl font-bold text-fg">Review queue ({pending.length})</h2>
        <div className="mt-3 space-y-4">
          {pending.length === 0 && <p className="text-base text-muted">Nothing waiting for review.</p>}
          {pending.map((c) => (
            <ReviewCard
              key={c.id}
              candidate={{
                id: c.id,
                kind: c.kind,
                title: c.title,
                reason: c.reason,
                evidenceUrl: c.evidenceUrl,
                proposed: c.proposed as Record<string, unknown>,
                current: (c.current as Record<string, unknown> | null) ?? null,
                createdAt: when(c.createdAt),
                sourceName: c.source?.name ?? "Link checker",
                listing: c.exam ? { name: c.exam.name, href: `/exams/${c.exam.slug}` } : c.scheme ? { name: c.scheme.name, href: `/schemes/${c.scheme.slug}` } : null,
              }}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="checks-h">
        <h2 id="checks-h" className="text-2xl font-bold text-fg">Recent checks</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[800px]">
            <thead className="bg-surface-muted">
              <tr><th className={th}>Started</th><th className={th}>Source</th><th className={th}>Outcome</th><th className={th}>HTTP</th><th className={th}>Parser</th><th className={th}>Items</th><th className={th}>Changes / error</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentChecks.map((c) => (
                <tr key={c.id}>
                  <td className={td}>{when(c.startedAt)}</td>
                  <td className={td}>{c.source.name}</td>
                  <td className={td}>{c.outcome ?? "running"}</td>
                  <td className={td}>{c.httpStatus ?? "—"}</td>
                  <td className={td}>{c.parserVersion ?? "—"}</td>
                  <td className={td}>{c.itemsFound ?? "—"}</td>
                  <td className={`${td} max-w-md break-words`}>{c.error ?? c.changeSummary ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="links-h">
        <h2 id="links-h" className="text-2xl font-bold text-fg">Link problems</h2>
        <p className="mt-1 text-base text-muted">Blocked or not-allowed links need a manual check. Failures never change a listing&apos;s status.</p>
        <ul className="mt-3 space-y-2">
          {linkProblems.length === 0 && <li className="text-base text-muted">No link problems recorded.</li>}
          {linkProblems.map((l) => (
            <li key={l.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-link underline">{l.url}</a>
              <div className="text-muted">{l.lastResult} {l.httpStatus ? `(HTTP ${l.httpStatus})` : ""} · {l.consecutiveFailures} failures in a row · checked {when(l.lastCheckedAt)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stale-h">
        <h2 id="stale-h" className="text-2xl font-bold text-fg">Listings needing confirmation ({staleItems.length})</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {staleItems.slice(0, 40).map((i) => (
            <li key={`${i.kind}-${i.id}`} className="rounded-xl border border-line bg-surface p-3 text-sm">
              <Link href={i.kind === "exam" ? `/exams/${i.slug}` : `/schemes/${i.slug}`} className="font-semibold text-link underline">{i.name}</Link>
              <div className="text-muted">{i.freshness.label} · last verified {when(i.freshness.lastVerifiedAt)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="audit-h">
        <h2 id="audit-h" className="text-2xl font-bold text-fg">Recent audit trail</h2>
        <ul className="mt-3 space-y-2">
          {recentAudit.map((a) => (
            <li key={a.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
              <span className="font-semibold text-fg">{a.action}</span> on {a.entityType} <code className="text-muted">{a.entityId}</code> by {a.actor} · {when(a.createdAt)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
