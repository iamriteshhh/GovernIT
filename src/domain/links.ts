import { OpportunityStatus, isApplicationActionable, isApplicationInactive } from "./status";
import { FreshnessEvaluation } from "./freshness";

export type ApplyLinkKind = "DIRECT_APPLICATION" | "APPLICATION_PORTAL" | "DEPARTMENT_SITE";

/** Latest conservative reachability result for a URL (see LinkCheck). */
export interface LinkHealth {
  result: string | null;
  consecutiveFailures: number;
  lastCheckedAt: Date | null;
}

export interface ApplyAction {
  /** Visible button/link text. */
  label: string;
  /** "primary" = big apply button; "secondary" = plain official link. */
  emphasis: "primary" | "secondary";
  /** Extra plain-language caution shown next to the action, if any. */
  caution: string | null;
}

/** Failures this many times in a row are worth telling the user about (never a closure signal). */
export const LINK_FAILURE_NOTICE_THRESHOLD = 2;

/**
 * Decides how the official link is presented. Pure function.
 * Never calls a homepage "Apply", never presents a closed form as accepting submissions.
 */
export function describeApplyAction(input: {
  status: OpportunityStatus;
  linkKind: ApplyLinkKind;
  freshness: FreshnessEvaluation;
  linkHealth?: LinkHealth | null;
}): ApplyAction {
  const { status, linkKind, freshness, linkHealth } = input;
  const linkTrouble =
    linkHealth && linkHealth.consecutiveFailures >= LINK_FAILURE_NOTICE_THRESHOLD
      ? "We could not reach this link on recent checks. Use the official notification below if it does not open."
      : null;

  if (linkKind === "DEPARTMENT_SITE") {
    return { label: "Official department site", emphasis: "secondary", caution: linkTrouble };
  }

  if (isApplicationInactive(status)) {
    return {
      label: "Official site (applications closed)",
      emphasis: "secondary",
      caution: linkTrouble,
    };
  }

  if (!isApplicationActionable(status)) {
    return {
      label: linkKind === "DIRECT_APPLICATION" ? "Official application page" : "Official application portal",
      emphasis: "secondary",
      caution: linkTrouble ?? "Applications are not open yet.",
    };
  }

  const unconfirmed = freshness.trustworthy
    ? null
    : "Status needs confirmation: check the official notification before applying.";

  return {
    label: linkKind === "DIRECT_APPLICATION" ? "Apply on Official Site" : "Open Official Application",
    emphasis: "primary",
    caution: linkTrouble ?? unconfirmed,
  };
}
