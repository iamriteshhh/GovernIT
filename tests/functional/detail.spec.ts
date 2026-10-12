import { describe, it, expect } from "vitest";
import { examCreateSchema } from "@/validation/exam-schema";
import { schemeCreateSchema } from "@/validation/scheme-schema";

describe("Functional (schema-level, no browser): Opportunity Detail Specifications & Official Links", () => {
  it("should enforce at least one official source and valid application URL for an exam", () => {
    const validExam = {
      name: "UPSC Civil Services Examination 2026",
      slug: "upsc-cse-2026",
      conductingBodyId: "org-cuid-1",
      educationEligibility: "Bachelor's Degree in any discipline",
      ageEligibility: "21 to 32 years",
      officialApplyUrl: "https://upsconline.nic.in",
      opensAt: new Date().toISOString(),
      closesAt: new Date(Date.now() + 86400000 * 20).toISOString(),
      sources: [
        {
          url: "https://upsc.gov.in/notifications/cse-2026.pdf",
          type: "OFFICIAL_NOTIFICATION" as const,
          title: "Official Gazette Notification",
        },
      ],
    };

    const parsed = examCreateSchema.safeParse(validExam);
    expect(parsed.success).toBe(true);
  });

  it("should reject an exam with zero official sources (Anti-Fabrication Rule)", () => {
    const invalidExam = {
      name: "Fabricated Exam",
      slug: "fabricated-exam",
      conductingBodyId: "org-1",
      educationEligibility: "Any",
      ageEligibility: "18+",
      officialApplyUrl: "https://apply.gov.in",
      opensAt: new Date().toISOString(),
      sources: [], // BANNED: Zero official sources
    };

    const parsed = examCreateSchema.safeParse(invalidExam);
    expect(parsed.success).toBe(false);
  });

  it("should enforce at least one official guideline link for a citizen scheme", () => {
    const invalidScheme = {
      name: "Fabricated Welfare Scheme",
      slug: "fabricated-scheme",
      departmentId: "dept-1",
      whoCanBenefit: "Everyone",
      eligibility: "All citizens",
      benefits: "₹5000",
      requiredDocuments: "Aadhaar",
      applicationProcess: "Online",
      officialApplyUrl: "https://myscheme.gov.in",
      sources: [], // BANNED
    };

    const parsed = schemeCreateSchema.safeParse(invalidScheme);
    expect(parsed.success).toBe(false);
  });
});
