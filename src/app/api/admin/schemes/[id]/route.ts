import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { schemeUpdateSchema } from "@/validation/scheme-schema";
import { schemeRepository } from "@/server/repositories/scheme-repository";
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
    const validated = schemeUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid update payload", details: validated.error.flatten() }, { status: 400 });
    }

    const data = validated.data;
    const adminIdentity = session.username || "admin";

    // Check scheme exists by ID or Slug
    let existing = await schemeRepository.findById(id);
    if (!existing) {
      existing = await schemeRepository.findBySlug(id);
    }

    if (!existing) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.whoCanBenefit !== undefined) updateData.whoCanBenefit = data.whoCanBenefit;
    if (data.eligibility !== undefined) updateData.eligibility = data.eligibility;
    if (data.benefits !== undefined) updateData.benefits = data.benefits;
    if (data.requiredDocuments !== undefined) updateData.requiredDocuments = data.requiredDocuments;
    if (data.applicationProcess !== undefined) updateData.applicationProcess = data.applicationProcess;
    if (data.stateId !== undefined) updateData.stateId = data.stateId;
    if (data.officialApplyUrl !== undefined) updateData.officialApplyUrl = data.officialApplyUrl;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

    // Handle deadline/applicationPeriod update if provided
    if (data.deadline !== undefined) {
      if (data.deadline) {
        await db.applicationPeriod.upsert({
          where: { schemeId: existing.id },
          update: {
            closesAt: new Date(data.deadline),
          },
          create: {
            schemeId: existing.id,
            opensAt: new Date(),
            closesAt: new Date(data.deadline),
          },
        });
      } else {
        await db.applicationPeriod.deleteMany({
          where: { schemeId: existing.id },
        });
      }
    }

    const updatedScheme = await schemeRepository.update(existing.id, updateData);

    console.info(`[ADMIN AUDIT] Scheme "${existing.slug}" updated by "${adminIdentity}": ${JSON.stringify(Object.keys(updateData))}`);
    return NextResponse.json({ success: true, scheme: updatedScheme });
  } catch (error) {
    console.error("Update scheme error:", error);
    return NextResponse.json({ error: "Failed to update scheme" }, { status: 500 });
  }
}
