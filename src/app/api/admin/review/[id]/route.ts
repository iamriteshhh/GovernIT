import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { reviewActionSchema } from "@/validation/admin-schema";
import { reviewCandidate, ReviewError } from "@/server/ingestion/review";
import { apiFailure } from "@/server/services/load";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const validated = reviewActionSchema.safeParse(await request.json());
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid review payload", details: validated.error.flatten() }, { status: 400 });
    }

    const { id } = await params;
    const result = await reviewCandidate(id, validated.data, session.username || "admin");
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return apiFailure("ADMIN_REVIEW", error);
  }
}
