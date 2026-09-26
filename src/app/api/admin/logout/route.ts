import { NextResponse } from "next/server";
import { authConfig } from "@/server/auth/auth-config";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete(authConfig.cookieName);
  return response;
}
