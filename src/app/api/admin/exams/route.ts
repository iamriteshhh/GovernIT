import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { examCreateSchema } from "@/validation/exam-schema";
import { adminWriteService } from "@/server/services/admin-write-service";
import { apiFailure } from "@/server/services/load";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const validated = examCreateSchema.safeParse(await request.json());
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid exam payload", details: validated.error.flatten() }, { status: 400 });
    }

    const exam = await adminWriteService.createExam(validated.data, session.username || "admin");
    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    return apiFailure("ADMIN_CREATE_EXAM", error);
  }
}
