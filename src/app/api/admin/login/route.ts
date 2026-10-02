import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/validation/admin-schema";
import { createSessionToken } from "@/server/auth/session";
import { authConfig, verifyAdminCredentials } from "@/server/auth/auth-config";
import { loginRateLimiter } from "@/server/auth/rate-limiter";

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "local-client";
}

export async function POST(request: NextRequest) {
  const clientKey = getClientIdentifier(request);

  // 1. Rate Limiting Check
  const rateLimitStatus = loginRateLimiter.check(clientKey);
  if (!rateLimitStatus.allowed) {
    console.warn(`[SECURITY AUDIT] Blocked brute force attempt from IP: ${clientKey}`);
    return NextResponse.json(
      {
        error: "Too many failed login attempts. Account temporarily locked for security.",
        retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitStatus.retryAfterSeconds ?? 900),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const validated = adminLoginSchema.safeParse(body);

    if (!validated.success) {
      loginRateLimiter.recordFailure(clientKey);
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
    }

    const { username, secretKey } = validated.data;

    // 2. Timing-Safe Credential Verification (Per-admin identity)
    const verification = verifyAdminCredentials(username, secretKey);

    if (!verification.valid) {
      const failure = loginRateLimiter.recordFailure(clientKey);
      console.warn(
        `[SECURITY AUDIT] Failed admin login attempt for user "${username}" from IP: ${clientKey}. Remaining attempts: ${failure.remainingAttempts}`
      );

      if (failure.isLocked) {
        return NextResponse.json(
          {
            error: "Too many failed attempts. Login locked for 15 minutes.",
            retryAfterSeconds: failure.retryAfterSeconds,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(failure.retryAfterSeconds ?? 900),
            },
          }
        );
      }

      return NextResponse.json(
        {
          error: "Unauthorized: Invalid username or secret key",
          remainingAttempts: failure.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Successful Login
    loginRateLimiter.recordSuccess(clientKey);
    console.info(`[SECURITY AUDIT] Successful admin login for "${verification.username}" from IP: ${clientKey}`);

    const token = createSessionToken(verification.username);
    const response = NextResponse.json({
      success: true,
      message: "Authenticated successfully",
      user: { username: verification.username, role: "admin" },
    });

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
