import { NextRequest, NextResponse } from "next/server";
import { examService } from "@/server/services/exam-service";

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
    console.error("API /api/exams/[id] error:", error);
    return NextResponse.json({ error: "Failed to retrieve exam details" }, { status: 500 });
  }
}
