import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/server/auth/session";
import { verificationActionSchema } from "@/validation/admin-schema";
import { verificationService } from "@/server/services/verification-service";

export async function POST(request: NextRequest) {
  try {
    const isAuthed = await isAuthenticatedAdmin(request);
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const body = await request.json();
    const validated = verificationActionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid verification payload", details: validated.error.flatten() }, { status: 400 });
    }

    const record = await verificationService.recordVerification(validated.data);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Failed to record verification" }, { status: 500 });
  }
}
