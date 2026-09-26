import { NextRequest, NextResponse } from "next/server";
import { schemeQuerySchema } from "@/validation/scheme-schema";
import { schemeService } from "@/server/services/scheme-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = schemeQuerySchema.safeParse(searchParams);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { search, category, state, centralOnly, status, limit, offset } = validated.data;

    let { schemes, total } = await schemeService.listSchemes({
      search,
      categorySlug: category,
      stateCode: state,
      onlyCentral: centralOnly,
      limit,
      offset,
    });

    if (status && status !== "all") {
      if (status === "closing-soon") {
        schemes = schemes.filter((s) => s.status.status === "CLOSING_SOON");
      } else if (status === "open") {
        schemes = schemes.filter((s) => s.status.status === "APPLICATION_OPEN" || s.status.status === "CLOSING_SOON");
      } else if (status === "closed") {
        schemes = schemes.filter((s) => s.status.status === "CLOSED");
      }
      total = schemes.length;
    }

    return NextResponse.json({
      data: schemes,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("API /api/schemes error:", error);
    return NextResponse.json({ error: "Failed to retrieve schemes" }, { status: 500 });
  }
}
