import { describeApplyAction, ApplyLinkKind, LinkHealth } from "@/domain/links";
import { FreshnessEvaluation } from "@/domain/freshness";
import { OpportunityStatus } from "@/domain/status";
import { ExternalLink, FileText, Info } from "lucide-react";

interface OfficialActionsProps {
  applyUrl: string;
  linkKind: ApplyLinkKind;
  noticeUrl: string | null;
  status: OpportunityStatus;
  freshness: FreshnessEvaluation;
  linkHealth: LinkHealth | null;
  size?: "card" | "detail";
}

/**
 * The official destinations, kept distinct: application link vs official notification.
 * Labels come from describeApplyAction so a homepage is never called "Apply".
 */
export function OfficialActions({ applyUrl, linkKind, noticeUrl, status, freshness, linkHealth, size = "card" }: OfficialActionsProps) {
  const action = describeApplyAction({ status, linkKind, freshness, linkHealth });
  const big = size === "detail";

  const primaryCls = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-fg hover:bg-primary-hover ${big ? "py-3 text-base" : "py-2.5 text-sm"}`;
  const secondaryCls = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 font-semibold text-fg hover:bg-surface-muted ${big ? "py-3 text-base" : "py-2.5 text-sm"}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={action.emphasis === "primary" ? primaryCls : secondaryCls}
        >
          {action.label}
          <ExternalLink className="h-4 w-4" aria-hidden />
          <span className="sr-only">(opens official website in a new tab)</span>
        </a>
        {noticeUrl && (
          <a href={noticeUrl} target="_blank" rel="noopener noreferrer" className={secondaryCls}>
            <FileText className="h-4 w-4" aria-hidden />
            Official notification
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
      {action.caution && (
        <p className="flex items-start gap-1.5 text-sm text-urgent">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {action.caution}
        </p>
      )}
    </div>
  );
}
