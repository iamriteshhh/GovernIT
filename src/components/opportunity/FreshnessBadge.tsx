import { FreshnessEvaluation } from "@/domain/freshness";
import { formatDateIST } from "@/lib/dates";
import { AlertTriangle, HelpCircle, ShieldCheck } from "lucide-react";

/** "Last verified" line. Untrusted states are spelled out, never shown as verified. */
export function FreshnessBadge({ freshness }: { freshness: FreshnessEvaluation }) {
  const Icon = freshness.trustworthy ? ShieldCheck : freshness.state === "UNVERIFIED" ? HelpCircle : AlertTriangle;
  const tone = freshness.trustworthy ? "text-success" : "text-urgent";

  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
      <Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden />
      <span className={`font-semibold ${tone}`}>{freshness.label}</span>
      <span aria-hidden>·</span>
      <span>
        Last verified:{" "}
        <strong className="font-semibold text-fg">
          {freshness.lastVerifiedAt ? formatDateIST(freshness.lastVerifiedAt) : "never"}
        </strong>
      </span>
    </p>
  );
}
