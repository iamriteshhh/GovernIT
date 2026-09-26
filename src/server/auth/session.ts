import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { authConfig, AUTH_COOKIE_NAME } from "./auth-config";

/**
 * Creates a signed admin session token
 */
export function createSessionToken(): string {
  const payload = {
    role: "admin",
    createdAt: Date.now(),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", authConfig.adminSecret)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies an admin session token
 */
export function verifySessionToken(token: string | null | undefined): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadBase64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", authConfig.adminSecret)
    .update(payloadBase64)
    .digest("base64url");

  const bufProvided = Buffer.from(providedSig);
  const bufExpected = Buffer.from(expectedSig);

  if (bufProvided.length !== bufExpected.length) {
    return false;
  }

  if (!crypto.timingSafeEqual(bufProvided, bufExpected)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
    const age = Date.now() - payload.createdAt;
    return age < authConfig.maxAgeSeconds * 1000;
  } catch {
    return false;
  }
}

/**
 * Checks if current request has a valid admin session cookie
 */
export async function isAuthenticatedAdmin(request?: NextRequest): Promise<boolean> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      return false;
    }
  }

  return verifySessionToken(token);
}
