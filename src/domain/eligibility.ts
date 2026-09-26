/**
 * Foundational Eligibility Types (Phase 2 Roadmap Preparation)
 * Note: Only data structures live here in MVP — no matching algorithm or UI ships in MVP.
 */

export type EducationLevel =
  | "10TH"
  | "12TH"
  | "DIPLOMA"
  | "10TH_PLUS_ITI_OR_DIPLOMA"
  | "12TH_OR_GRADUATION"
  | "GRADUATION"
  | "POST_GRADUATION"
  | "DOCTORATE"
  | "OTHER";

export interface EligibilityCriteriaShape {
  id?: string;
  minAge?: number | null;
  maxAge?: number | null;
  educationLevel?: EducationLevel | string | null;
  incomeBand?: string | null;
  applicableStates?: string | null;
  occupationTags?: string | null;
}
