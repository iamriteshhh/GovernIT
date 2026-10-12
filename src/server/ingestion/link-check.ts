import { db } from "@/lib/db";
import { FetchBlockedError, httpStatusOf, isHostAllowed, safeFetch } from "./safe-fetch";
import { sha256 } from "./html";

/**
 * Conservative reachability checks for official links. A failure NEVER changes an opportunity's
 * status: it only annotates the link and, after repeated hard failures, asks an admin to look.
 */

/** Hosts we may contact for link checks. Anything else is recorded as NOT_ALLOWED (manual check). */
export const LINK_CHECK_HOSTS = ["gov.in", "nic.in", "tnpscexams.in"];
export const BROKEN_REVIEW_THRESHOLD = 3;
const RECHECK_AFTER_MS = 24 * 60 * 60 * 1000;

export type LinkResult = "OK" | "REDIRECTED" | "BLOCKED" | "NOT_FOUND" | "SERVER_ERROR" | "NETWORK_ERROR" | "NOT_ALLOWED";

/** Only definite failures count towards "broken". Bot blocks and rate limits are inconclusive. */
/** Errors browsers usually tolerate (AIA chain fetching, lenient header parsing): inconclusive, not broken. */
const INCONCLUSIVE_CODES = /^(UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT(_LOCALLY)?|SELF_SIGNED_CERT_IN_CHAIN|HPE_)/;

export function classifyLinkError(error: unknown): LinkResult {
  const code = (error as NodeJS.ErrnoException | null)?.code ?? "";
  if (INCONCLUSIVE_CODES.test(code)) return "BLOCKED";
  if (error instanceof FetchBlockedError) return /allowlist|Protocol|Raw IP|Credentials/.test(error.message) ? "NOT_ALLOWED" : "BLOCKED";
  const status = httpStatusOf(error);
  if (status === 404 || status === 410) return "NOT_FOUND";
  if (status === 401 || status === 403 || status === 405 || status === 429 || status === 451) return "BLOCKED";
  if (status && status >= 500) return "SERVER_ERROR";
  return "NETWORK_ERROR";
}

export const countsAsFailure = (r: LinkResult) => r === "NOT_FOUND" || r === "SERVER_ERROR" || r === "NETWORK_ERROR";

function sameDestination(a: string, b: string) {
  const x = new URL(a);
  const y = new URL(b);
  return x.hostname.replace(/^www\./, "") === y.hostname.replace(/^www\./, "") && x.pathname.replace(/\/$/, "") === y.pathname.replace(/\/$/, "");
}

export async function checkLink(url: string, fetcher: typeof safeFetch = safeFetch): Promise<{ result: LinkResult; status: number | null; finalUrl: string | null }> {
  try {
    const host = new URL(url).hostname;
    if (!isHostAllowed(host, LINK_CHECK_HOSTS)) return { result: "NOT_ALLOWED", status: null, finalUrl: null };
  } catch {
    return { result: "NOT_ALLOWED", status: null, finalUrl: null };
  }
  const opts = { allowedHosts: LINK_CHECK_HOSTS, allowHttp: true, timeoutMs: 12_000, maxBytes: 300_000, retries: 1, maxRedirects: 5 };
  try {
    let res;
    try {
      res = await fetcher(url, { ...opts, method: "HEAD" });
    } catch (error) {
      // Many government servers reject HEAD; fall back to a small GET before judging.
      if (httpStatusOf(error) === 405 || httpStatusOf(error) === 403 || httpStatusOf(error) === 404) res = await fetcher(url, opts);
      else throw error;
    }
    return { result: sameDestination(url, res.finalUrl) ? "OK" : "REDIRECTED", status: res.status, finalUrl: res.finalUrl };
  } catch (error) {
    return { result: classifyLinkError(error), status: httpStatusOf(error), finalUrl: null };
  }
}

/** Official URLs currently shown to users (apply links + notice sources of live listings). */
async function liveUrls(): Promise<Array<{ url: string; examId?: string; schemeId?: string; label: string }>> {
  const live = { isPublished: true, isArchived: false };
  const [exams, schemes] = await Promise.all([
    db.exam.findMany({ where: live, select: { id: true, name: true, officialApplyUrl: true, sources: { select: { url: true } } } }),
    db.scheme.findMany({ where: live, select: { id: true, name: true, officialApplyUrl: true, sources: { select: { url: true } } } }),
  ]);
  const out = new Map<string, { url: string; examId?: string; schemeId?: string; label: string }>();
  for (const e of exams) for (const url of [e.officialApplyUrl, ...e.sources.map((s) => s.url)]) out.set(url, { url, examId: e.id, label: e.name });
  for (const s of schemes) for (const url of [s.officialApplyUrl, ...s.sources.map((x) => x.url)]) out.set(url, { url, schemeId: s.id, label: s.name });
  return [...out.values()];
}

export async function runLinkChecks(opts: { limit: number; fetcher?: typeof safeFetch; now?: Date }) {
  const now = opts.now ?? new Date();
  const urls = await liveUrls();
  const known = new Map((await db.linkCheck.findMany({ where: { url: { in: urls.map((u) => u.url) } } })).map((r) => [r.url, r]));

  const due = urls
    .filter((u) => {
      const k = known.get(u.url);
      return !k?.lastCheckedAt || now.getTime() - k.lastCheckedAt.getTime() > RECHECK_AFTER_MS;
    })
    .sort((a, b) => (known.get(a.url)?.lastCheckedAt?.getTime() ?? 0) - (known.get(b.url)?.lastCheckedAt?.getTime() ?? 0))
    .slice(0, opts.limit);

  let queued = 0;
  for (const target of due) {
    const prev = known.get(target.url);
    const { result, status, finalUrl } = await checkLink(target.url, opts.fetcher);
    const failure = countsAsFailure(result);
    const failures = failure ? (prev?.consecutiveFailures ?? 0) + 1 : result === "OK" || result === "REDIRECTED" ? 0 : prev?.consecutiveFailures ?? 0;

    const row = await db.linkCheck.upsert({
      where: { url: target.url },
      create: {
        url: target.url, lastCheckedAt: now, lastResult: result, httpStatus: status, finalUrl,
        consecutiveFailures: failures, lastOkAt: failure ? null : result === "OK" || result === "REDIRECTED" ? now : null,
      },
      update: {
        lastCheckedAt: now, lastResult: result, httpStatus: status, finalUrl, consecutiveFailures: failures,
        ...(result === "OK" || result === "REDIRECTED" ? { lastOkAt: now } : {}),
      },
    });

    if (failures >= BROKEN_REVIEW_THRESHOLD) {
      const fingerprint = sha256(JSON.stringify(["LINK_BROKEN", target.url, row.lastOkAt?.toISOString() ?? "never-ok"]));
      const exists = await db.changeCandidate.findUnique({ where: { fingerprint }, select: { id: true } });
      if (!exists) {
        await db.changeCandidate.create({
          data: {
            kind: "LINK_BROKEN",
            title: `Official link failing: ${target.label}`,
            evidenceUrl: target.url,
            proposed: { url: target.url, result, httpStatus: status, consecutiveFailures: failures },
            reason: "Link failed several checks in a row. Confirm manually and replace it only with a URL taken from an official page. Status is NOT changed automatically.",
            examId: target.examId ?? null,
            schemeId: target.schemeId ?? null,
            fingerprint,
          },
        });
        queued++;
      }
    }
  }
  return { checked: due.length, queued };
}
