import { NextRequest, NextResponse } from "next/server";
import { schemeService } from "@/server/services/scheme-service";
import { apiFailure } from "@/server/services/load";

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
    return apiFailure("API_SCHEME_DETAIL", error);
  }
}
