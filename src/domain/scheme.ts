import { LifecycleState, StatusEvaluation } from "./status";
import { FreshnessEvaluation } from "./freshness";
import { ApplyLinkKind, LinkHealth } from "./links";
import { OpportunitySource, OpportunityVerification } from "./exam";

export interface SchemeOpportunity {
  kind: "scheme";
  id: string;
  name: string;
  slug: string;
  department: {
    id: string;
    name: string;
    type: "CENTRAL" | "STATE";
  };
  whoCanBenefit: string;
  eligibility: string;
  benefits: string;
  requiredDocuments: string;
  applicationProcess: string;
  /** Canonical application window (same model as exams). */
  applicationPeriod: {
    opensAt: Date | null;
    closesAt: Date | null;
    isRolling: boolean;
  } | null;
  /** End of the programme itself; not an application deadline. */
  programEndsAt: Date | null;
  state: {
    id: string;
    name: string;
    code: string;
  } | null;
  officialApplyUrl: string;
  applyLinkKind: ApplyLinkKind;
  noticeUrl: string | null;
  lifecycle: LifecycleState;
  lifecycleNote: string | null;
  isPublished: boolean;
  isArchived: boolean;
  sources: OpportunitySource[];
  verifications: OpportunityVerification[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  /** Application status (kept as `status` for API compatibility). */
  status: StatusEvaluation;
  /** Alias of `status` so schemes and exams share prioritisation code. */
  applicationStatus: StatusEvaluation;
  freshness: FreshnessEvaluation;
  linkHealth: LinkHealth | null;
  lastVerifiedAt: Date | null;
}
