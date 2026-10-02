import { NextRequest, NextResponse } from "next/server";
import { searchService } from "@/server/services/search-service";

export async function GET(request: NextRequest) {
  try {
    const rawQ = request.nextUrl.searchParams.get("q") ?? "";
    const q = rawQ.slice(0, 150).trim();
    const category = request.nextUrl.searchParams.get("category") ?? undefined;
    const state = request.nextUrl.searchParams.get("state") ?? undefined;
    const centralOnly = request.nextUrl.searchParams.get("centralOnly") === "true";
    const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
    const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));

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
