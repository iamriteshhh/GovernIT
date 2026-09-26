import { NextRequest, NextResponse } from "next/server";
import { examQuerySchema } from "@/validation/exam-schema";
import { examService } from "@/server/services/exam-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = examQuerySchema.safeParse(searchParams);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { search, category, state, centralOnly, status, limit, offset } = validated.data;

    let { exams, total } = await examService.listExams({
      search,
      categorySlug: category,
      stateCode: state,
      onlyCentral: centralOnly,
      limit,
      offset,
    });

    // Apply status filter if specified
    if (status && status !== "all") {
      if (status === "closing-soon") {
        exams = exams.filter((e) => e.applicationStatus.status === "CLOSING_SOON");
      } else if (status === "open") {
        exams = exams.filter(
          (e) => e.applicationStatus.status === "APPLICATION_OPEN" || e.applicationStatus.status === "CLOSING_SOON"
        );
      } else if (status === "upcoming") {
        exams = exams.filter((e) => e.examScheduleStatus.status === "EXAM_UPCOMING");
      } else if (status === "closed") {
        exams = exams.filter((e) => e.applicationStatus.status === "CLOSED");
      }
      total = exams.length;
    }

    return NextResponse.json({
      data: exams,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("API /api/exams error:", error);
    return NextResponse.json({ error: "Failed to retrieve exams" }, { status: 500 });
  }
}
