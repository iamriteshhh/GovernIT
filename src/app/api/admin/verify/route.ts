import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { verificationActionSchema } from "@/validation/admin-schema";
import { verificationService } from "@/server/services/verification-service";

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

    console.info(`[VERIFICATION AUDIT] Record verified by "${adminIdentity}": ${JSON.stringify(validated.data)}`);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Failed to record verification" }, { status: 500 });
  }
}
