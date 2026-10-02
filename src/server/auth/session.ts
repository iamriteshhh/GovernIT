import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { authConfig, AUTH_COOKIE_NAME } from "./auth-config";

export interface SessionPayload {
  role: "admin";
  username: string;
  createdAt: number;
}

/**
 * Creates a signed admin session token with per-admin identity
 */
export function createSessionToken(username = "admin"): string {
  const payload: SessionPayload = {
    role: "admin",
    username,
    createdAt: Date.now(),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", authConfig.authSecret || authConfig.adminSecret)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies an admin session token and returns decoded payload if valid
 */
export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", authConfig.authSecret || authConfig.adminSecret)
    .update(payloadBase64)
    .digest("base64url");

  const bufProvided = Buffer.from(providedSig);
  const bufExpected = Buffer.from(expectedSig);

  if (bufProvided.length !== bufExpected.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(bufProvided, bufExpected)) {
    return null;
  }

  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
    const age = Date.now() - payload.createdAt;
    if (age < authConfig.maxAgeSeconds * 1000) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if current request has a valid admin session cookie
 */
export async function isAuthenticatedAdmin(request?: NextRequest): Promise<boolean> {
  const session = await getAuthenticatedAdmin(request);
  return session.isAuthenticated;
}

/**
 * Returns authenticated admin session info with identity
 */
export async function getAuthenticatedAdmin(
  request?: NextRequest
): Promise<{ isAuthenticated: boolean; username: string | null }> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      return { isAuthenticated: false, username: null };
    }
  }

  const payload = verifySessionToken(token);
  if (payload) {
    return { isAuthenticated: true, username: payload.username || "admin" };
  }
  return { isAuthenticated: false, username: null };
}
