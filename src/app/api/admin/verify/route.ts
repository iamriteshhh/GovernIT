import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { verificationActionSchema } from "@/validation/admin-schema";
import { verificationService } from "@/server/services/verification-service";
import { writeAudit } from "@/server/services/audit";
import { apiFailure } from "@/server/services/load";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const body = await request.json();
    const validated = verificationActionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid verification payload", details: validated.error.flatten() }, { status: 400 });
    }

    // Record verifiedBy using the real authenticated identity
    const adminIdentity = session.username || "admin";
    const record = await verificationService.recordVerification({
      ...validated.data,
      verifiedBy: adminIdentity,
    });

    await writeAudit({
      actor: adminIdentity,
      action: "verification.record",
      entityType: record.examId ? "exam" : "scheme",
      entityId: record.examId ?? record.schemeId ?? "unknown",
      changes: { notes: record.notes },
    });
    return NextResponse.json({ success: true, record });
  } catch (error) {
    return apiFailure("ADMIN_VERIFY", error);
  }
}
