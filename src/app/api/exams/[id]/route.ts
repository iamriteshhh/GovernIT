import { NextRequest, NextResponse } from "next/server";
import { examService } from "@/server/services/exam-service";
import { apiFailure } from "@/server/services/load";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exam = await examService.getExamBySlug(id);

    if (!exam) {
      return NextResponse.json({ error: "Exam opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ data: exam });
  } catch (error) {
    return apiFailure("API_EXAM_DETAIL", error);
  }
}
