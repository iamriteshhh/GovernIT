import { StatusEvaluation } from "./status";

export interface SchemeOpportunity {
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
  deadline: Date | null;
  state: {
    id: string;
    name: string;
    code: string;
  } | null;
  officialApplyUrl: string;
  isPublished: boolean;
  isArchived: boolean;
  sources: Array<{
    id: string;
    url: string;
    type: string;
    title: string | null;
    retrievedAt: Date;
  }>;
  verifications: Array<{
    id: string;
    verifiedAt: Date;
    verifiedBy: string;
    notes: string | null;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  status: StatusEvaluation;
  lastVerifiedAt: Date | null;
}
