import { FreshnessEvaluation } from "@/domain/freshness";
import { LifecycleState } from "@/domain/status";
import { OpportunitySource, OpportunityVerification } from "@/domain/exam";
import { formatDateIST } from "@/lib/dates";
import { AlertTriangle, Archive, ExternalLink, ShieldCheck } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  OFFICIAL_NOTIFICATION: "Official notification",
  OFFICIAL_GUIDELINE: "Official guidelines",
  OFFICIAL_APPLICATION_PORTAL: "Official application portal",
  OTHER_OFFICIAL: "Official page",
};

/** Cancelled / withdrawn / superseded / archived: impossible to miss, never actionable. */
export function LifecycleBanner({ lifecycle, note, isArchived }: { lifecycle: LifecycleState; note: string | null; isArchived: boolean }) {
  if (lifecycle === "ACTIVE" && !isArchived) return null;
  const heading =
    lifecycle === "ACTIVE" ? "Archived listing" : `This opportunity has been ${lifecycle.toLowerCase()}`;
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-danger-line bg-danger-bg p-5 text-danger">
      <Archive className="mt-1 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="text-lg font-bold">{heading}</p>
        <p className="mt-1 text-base">
          {note ?? "Kept for reference only. Do not apply using this listing."}
        </p>
      </div>
    </div>
  );
}

export function FreshnessBanner({ freshness }: { freshness: FreshnessEvaluation }) {
  if (freshness.trustworthy) return null;
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-urgent-line bg-urgent-bg p-5 text-urgent">
      <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="text-lg font-bold">{freshness.label}</p>
        <p className="mt-1 text-base">
          {freshness.state === "UNVERIFIED"
            ? "These details have not been checked against an official source yet."
            : freshness.state === "REVIEW_REQUIRED"
            ? "An official source shows a change that our team is reviewing."
            : freshness.state === "CHECK_FAILED"
            ? "Our latest attempt to check the official source failed."
            : "These details have not been confirmed recently."}{" "}
          Confirm the dates in the official notification before you apply or pay any fee.
        </p>
      </div>
    </div>
  );
}

export function KeyDate({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${emphasis ? "border-urgent-line bg-urgent-bg" : "border-line bg-surface-muted"}`}>
      <dt className={`text-sm font-semibold ${emphasis ? "text-urgent" : "text-muted"}`}>{label}</dt>
      <dd className="mt-1 text-base font-bold text-fg">{value}</dd>
    </div>
  );
}

export function SourcesAndVerification({ sources, verifications }: { sources: OpportunitySource[]; verifications: OpportunityVerification[] }) {
  const latest = verifications[0];
  return (
    <section className="mt-10 border-t border-line pt-8" aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="flex items-center gap-2 text-xl font-bold text-fg">
        <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
        Official sources
      </h2>
      <p className="mt-1 text-base text-muted">
        {latest
          ? `Last verified on ${formatDateIST(latest.verifiedAt)}${latest.notes ? ` — ${latest.notes}` : ""}`
          : "Not yet verified against these sources."}
      </p>
      <ul className="mt-4 space-y-3">
        {sources.map((source) => (
          <li key={source.id} className="rounded-xl border border-line bg-surface-muted p-4">
            <p className="text-sm font-semibold text-muted">{SOURCE_LABELS[source.type] ?? "Official page"}</p>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 break-all text-base font-semibold text-link underline"
            >
              {source.title ?? source.url}
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
