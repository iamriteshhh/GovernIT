import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { examUpdateSchema } from "@/validation/exam-schema";
import { examRepository } from "@/server/repositories/exam-repository";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = examUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid update payload", details: validated.error.flatten() }, { status: 400 });
    }

    const data = validated.data;
    const adminIdentity = session.username || "admin";

    // Check exam exists by ID or Slug
    let existing = await examRepository.findById(id);
    if (!existing) {
      existing = await examRepository.findBySlug(id);
    }

    if (!existing) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.conductingBodyId !== undefined) updateData.conductingBodyId = data.conductingBodyId;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.educationEligibility !== undefined) updateData.educationEligibility = data.educationEligibility;
    if (data.ageEligibility !== undefined) updateData.ageEligibility = data.ageEligibility;
    if (data.stateId !== undefined) updateData.stateId = data.stateId;
    if (data.examDate !== undefined) updateData.examDate = data.examDate ? new Date(data.examDate) : null;
    if (data.admitCardDate !== undefined) updateData.admitCardDate = data.admitCardDate ? new Date(data.admitCardDate) : null;
    if (data.resultStatus !== undefined) updateData.resultStatus = data.resultStatus;
    if (data.applicationFee !== undefined) updateData.applicationFee = data.applicationFee;
    if (data.vacancyCount !== undefined) updateData.vacancyCount = data.vacancyCount;
    if (data.officialApplyUrl !== undefined) updateData.officialApplyUrl = data.officialApplyUrl;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

    // Handle applicationPeriod update if provided
    if (data.opensAt || data.closesAt !== undefined) {
      await db.applicationPeriod.upsert({
        where: { examId: existing.id },
        update: {
          opensAt: data.opensAt ? new Date(data.opensAt) : undefined,
          closesAt: data.closesAt ? new Date(data.closesAt) : null,
        },
        create: {
          examId: existing.id,
          opensAt: data.opensAt ? new Date(data.opensAt) : new Date(),
          closesAt: data.closesAt ? new Date(data.closesAt) : null,
        },
      });
    }

    const updatedExam = await examRepository.update(existing.id, updateData);

    console.info(`[ADMIN AUDIT] Exam "${existing.slug}" updated by "${adminIdentity}": ${JSON.stringify(Object.keys(updateData))}`);
    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error("Update exam error:", error);
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}
