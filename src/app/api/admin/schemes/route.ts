import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { schemeCreateSchema } from "@/validation/scheme-schema";
import { adminWriteService } from "@/server/services/admin-write-service";
import { apiFailure } from "@/server/services/load";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const validated = schemeCreateSchema.safeParse(await request.json());
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid scheme payload", details: validated.error.flatten() }, { status: 400 });
    }

    const scheme = await adminWriteService.createScheme(validated.data, session.username || "admin");
    return NextResponse.json({ success: true, scheme }, { status: 201 });
  } catch (error) {
    return apiFailure("ADMIN_CREATE_SCHEME", error);
  }
}
