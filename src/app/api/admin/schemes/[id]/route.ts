import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { schemeUpdateSchema } from "@/validation/scheme-schema";
import { adminWriteService } from "@/server/services/admin-write-service";
import { apiFailure } from "@/server/services/load";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const { id } = await params;
    const validated = schemeUpdateSchema.safeParse(await request.json());
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid update payload", details: validated.error.flatten() }, { status: 400 });
    }

    const scheme = await adminWriteService.updateScheme(id, validated.data, session.username || "admin");
    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, scheme });
  } catch (error) {
    return apiFailure("ADMIN_UPDATE_SCHEME", error);
  }
}
