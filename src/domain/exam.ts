import { LifecycleState, StatusEvaluation } from "./status";
import { FreshnessEvaluation } from "./freshness";
import { ApplyLinkKind, LinkHealth } from "./links";

export interface OpportunitySource {
  id: string;
  url: string;
  type: string;
  title: string | null;
  retrievedAt: Date;
}

export interface OpportunityVerification {
  id: string;
  verifiedAt: Date;
  verifiedBy: string;
  notes: string | null;
}

export interface ExamOpportunity {
  kind: "exam";
  id: string;
  name: string;
  slug: string;
  conductingBody: {
    id: string;
    name: string;
    type: "CENTRAL" | "STATE";
  };
  department: string | null;
  educationEligibility: string;
  ageEligibility: string;
  state: {
    id: string;
    name: string;
    code: string;
  } | null;
  examDate: Date | null;
  admitCardDate: Date | null;
  resultDate: Date | null;
  resultStatus: string | null;
  applicationFee: string | null;
  vacancyCount: number | null;
  officialApplyUrl: string;
  applyLinkKind: ApplyLinkKind;
  /** First official notification/guideline source, distinct from the apply URL. */
  noticeUrl: string | null;
  lifecycle: LifecycleState;
  lifecycleNote: string | null;
  isPublished: boolean;
  isArchived: boolean;
  applicationPeriod: {
    opensAt: Date | null;
    closesAt: Date | null;
    isRolling: boolean;
  } | null;
  sources: OpportunitySource[];
  verifications: OpportunityVerification[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  applicationStatus: StatusEvaluation;
  examScheduleStatus: StatusEvaluation;
  freshness: FreshnessEvaluation;
  linkHealth: LinkHealth | null;
  lastVerifiedAt: Date | null;
}
