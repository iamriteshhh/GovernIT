import { describe, it, expect } from "vitest";
import { examCreateSchema, examUpdateSchema } from "@/validation/exam-schema";
import { schemeCreateSchema, schemeUpdateSchema } from "@/validation/scheme-schema";
import { verifyAdminCredentials } from "@/server/auth/auth-config";
import { createSessionToken, verifySessionToken } from "@/server/auth/session";

describe("E2E & Functional: Admin Management & Full Editorial Lifecycle", () => {
  it("should authenticate allowed admin identity and issue signed session", () => {
    const credCheck = verifyAdminCredentials("editorial", "dev-only-editorial-pass-2026");
    expect(credCheck.valid).toBe(true);

    const token = createSessionToken(credCheck.username);
    const session = verifySessionToken(token);
    expect(session?.username).toBe("editorial");
    expect(session?.role).toBe("admin");
  });

  it("should validate full creation payload for a government exam", () => {
    const newExamPayload = {
      name: "SSC Combined Graduate Level 2026",
      slug: "ssc-cgl-2026",
      conductingBodyId: "cuid-org-ssc",
      department: "DoPT Central Ministries",
      educationEligibility: "Bachelor's Degree",
      ageEligibility: "18 to 30 years",
      officialApplyUrl: "https://ssc.gov.in",
      opensAt: new Date().toISOString(),
      closesAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      vacancyCount: 14000,
      applicationFee: "₹100 (Exempt for Women/SC/ST)",
      sources: [
        {
          url: "https://ssc.gov.in/cgl-2026.pdf",
          type: "OFFICIAL_NOTIFICATION" as const,
          title: "SSC CGL 2026 Gazette Notification",
        },
      ],
    };

    const validated = examCreateSchema.safeParse(newExamPayload);
    expect(validated.success).toBe(true);
  });

  it("should validate full creation payload for a citizen scheme", () => {
    const newSchemePayload = {
      name: "PM SVANidhi Scheme",
      slug: "pm-svanidhi",
      departmentId: "cuid-dept-housing",
      whoCanBenefit: "Urban street vendors",
      eligibility: "Street vendors engaged in vending in urban areas",
      benefits: "Collateral-free working capital loan up to ₹50,000",
      requiredDocuments: "Aadhaar Card, Vending Certificate",
      applicationProcess: "Online application via PM SVANidhi Portal",
      officialApplyUrl: "https://pmsvanidhi.mohua.gov.in",
      sources: [
        {
          url: "https://pmsvanidhi.mohua.gov.in/guidelines.pdf",
          type: "OFFICIAL_GUIDELINE" as const,
          title: "PM SVANidhi Scheme Guidelines",
        },
      ],
    };

    const validated = schemeCreateSchema.safeParse(newSchemePayload);
    expect(validated.success).toBe(true);
  });

  it("should validate publish / unpublish and archive update mutations", () => {
    const unpublishExam = examUpdateSchema.safeParse({ isPublished: false });
    expect(unpublishExam.success).toBe(true);

    const archiveScheme = schemeUpdateSchema.safeParse({ isArchived: true });
    expect(archiveScheme.success).toBe(true);

    const partialEdit = examUpdateSchema.safeParse({
      name: "SSC CGL 2026 (Revised Dates)",
      vacancyCount: 15500,
    });
    expect(partialEdit.success).toBe(true);
  });
});
