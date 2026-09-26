import { NextRequest, NextResponse } from "next/server";
import { searchService } from "@/server/services/search-service";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const category = request.nextUrl.searchParams.get("category") ?? undefined;
    const state = request.nextUrl.searchParams.get("state") ?? undefined;
    const centralOnly = request.nextUrl.searchParams.get("centralOnly") === "true";
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);

    const results = await searchService.searchAll(q, {
      categorySlug: category,
      stateCode: state,
      onlyCentral: centralOnly,
      limit,
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("API /api/search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
