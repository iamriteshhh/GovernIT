import { NextRequest, NextResponse } from "next/server";
import { schemeService } from "@/server/services/scheme-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scheme = await schemeService.getSchemeBySlug(id);

    if (!scheme) {
      return NextResponse.json({ error: "Scheme opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ data: scheme });
  } catch (error) {
    console.error("API /api/schemes/[id] error:", error);
    return NextResponse.json({ error: "Failed to retrieve scheme details" }, { status: 500 });
  }
}
