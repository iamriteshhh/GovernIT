import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/validation/admin-schema";
import { createSessionToken } from "@/server/auth/session";
import { authConfig } from "@/server/auth/auth-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = adminLoginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
    }

    const { secretKey } = validated.data;

    // Check against configured adminSecret
    if (secretKey !== authConfig.adminSecret) {
      return NextResponse.json({ error: "Unauthorized: Invalid secret key" }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true, message: "Authenticated successfully" });

    response.cookies.set(authConfig.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: authConfig.maxAgeSeconds,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
