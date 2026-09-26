import { db } from "@/lib/db";
import { SourceType } from "@prisma/client";

export const verificationService = {
  async recordVerification(params: {
    examId?: string;
    schemeId?: string;
    verifiedBy?: string;
    notes?: string;
  }) {
    const { examId, schemeId, verifiedBy = "editorial_admin", notes } = params;

    return db.verification.create({
      data: {
        examId,
        schemeId,
        verifiedBy,
        notes,
        verifiedAt: new Date(),
      },
    });
  },

  async validatePublishable(params: {
    sources: Array<{ url: string; type: SourceType }>;
    hasOfficialNotification: boolean;
  }): Promise<{ canPublish: boolean; error?: string }> {
    if (!params.sources || params.sources.length === 0) {
      return {
        canPublish: false,
        error: "At least one official source URL is strictly required before publishing.",
      };
    }

    const hasOfficial = params.sources.some(
      (s) =>
        s.type === SourceType.OFFICIAL_NOTIFICATION ||
        s.type === SourceType.OFFICIAL_GUIDELINE ||
        s.type === SourceType.OFFICIAL_APPLICATION_PORTAL
    );

    if (!hasOfficial) {
      return {
        canPublish: false,
        error: "Opportunity must link to an official government notification, guideline, or portal.",
      };
    }

    return { canPublish: true };
  },
};
