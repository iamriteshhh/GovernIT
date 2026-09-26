import { StatusEvaluation } from "./status";

export interface ExamOpportunity {
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
  isPublished: boolean;
  isArchived: boolean;
  applicationPeriod: {
    opensAt: Date;
    closesAt: Date | null;
  } | null;
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
  applicationStatus: StatusEvaluation;
  examScheduleStatus: StatusEvaluation;
  lastVerifiedAt: Date | null;
}
