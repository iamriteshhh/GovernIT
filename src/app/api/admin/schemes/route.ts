import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { schemeCreateSchema } from "@/validation/scheme-schema";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const body = await request.json();
    const validated = schemeCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid scheme payload", details: validated.error.flatten() }, { status: 400 });
    }

    const data = validated.data;
    const adminIdentity = session.username || "admin";

    const scheme = await db.scheme.create({
      data: {
        name: data.name,
        slug: data.slug,
        departmentId: data.departmentId,
        whoCanBenefit: data.whoCanBenefit,
        eligibility: data.eligibility,
        benefits: data.benefits,
        requiredDocuments: data.requiredDocuments,
        applicationProcess: data.applicationProcess,
        stateId: data.stateId,
        officialApplyUrl: data.officialApplyUrl,
        applicationPeriod: data.deadline
          ? {
              create: {
                opensAt: new Date(),
                closesAt: new Date(data.deadline),
              },
            }
          : undefined,
        sources: {
          create: data.sources.map((s) => ({
            url: s.url,
            type: s.type,
            title: s.title,
            retrievedAt: new Date(),
          })),
        },
        verifications: {
          create: {
            verifiedAt: new Date(),
            verifiedBy: adminIdentity,
            notes: `Created and verified via Admin Editorial Portal by ${adminIdentity}.`,
          },
        },
      },
    });

    console.info(`[ADMIN AUDIT] Scheme created by "${adminIdentity}": ${scheme.slug}`);
    return NextResponse.json({ success: true, scheme }, { status: 201 });
  } catch (error) {
    console.error("Create scheme error:", error);
    return NextResponse.json({ error: "Failed to create scheme" }, { status: 500 });
  }
}
