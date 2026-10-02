import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { examCreateSchema } from "@/validation/exam-schema";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedAdmin(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const body = await request.json();
    const validated = examCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid exam payload", details: validated.error.flatten() }, { status: 400 });
    }

    const data = validated.data;
    const adminIdentity = session.username || "admin";

    const exam = await db.exam.create({
      data: {
        name: data.name,
        slug: data.slug,
        conductingBodyId: data.conductingBodyId,
        department: data.department,
        educationEligibility: data.educationEligibility,
        ageEligibility: data.ageEligibility,
        stateId: data.stateId,
        examDate: data.examDate ? new Date(data.examDate) : null,
        admitCardDate: data.admitCardDate ? new Date(data.admitCardDate) : null,
        resultStatus: data.resultStatus,
        applicationFee: data.applicationFee,
        vacancyCount: data.vacancyCount,
        officialApplyUrl: data.officialApplyUrl,
        applicationPeriod: {
          create: {
            opensAt: new Date(data.opensAt),
            closesAt: data.closesAt ? new Date(data.closesAt) : null,
          },
        },
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

    console.info(`[ADMIN AUDIT] Exam created by "${adminIdentity}": ${exam.slug}`);
    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    console.error("Create exam error:", error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
