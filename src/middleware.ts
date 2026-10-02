import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/server/auth/session";
import { AUTH_COOKIE_NAME } from "@/server/auth/auth-config";
import { apiRateLimiter } from "@/server/auth/rate-limiter";

const STATE_CHANGING_METHODS = ["POST", "PATCH", "PUT", "DELETE"];

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "local-client";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Abuse & Flood Protection: Rate limiting for all API routes (100 req/min)
  if (pathname.startsWith("/api/")) {
    const clientKey = getClientIdentifier(request);
    const rateLimit = apiRateLimiter.check(clientKey);

    if (!rateLimit.allowed) {
      console.warn(`[SECURITY AUDIT] Rate limit exceeded for IP: ${clientKey} on route: ${pathname}`);
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "API rate limit exceeded. Please wait before retrying.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // Allow unauthenticated access to admin login routes
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // 2. Explicit CSRF defense for state-changing admin API requests
  if (pathname.startsWith("/api/admin/") && STATE_CHANGING_METHODS.includes(request.method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          console.warn(`[SECURITY AUDIT] Blocked cross-origin CSRF attempt from origin: ${origin} against host: ${host}`);
          return NextResponse.json({ error: "Forbidden: Cross-origin request rejected" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Forbidden: Malformed Origin header" }, { status: 403 });
      }
    } else if (referer) {
      try {
        const refererHost = new URL(referer).host;
        if (refererHost !== host) {
          console.warn(`[SECURITY AUDIT] Blocked cross-origin CSRF attempt from referer: ${referer} against host: ${host}`);
          return NextResponse.json({ error: "Forbidden: Cross-origin referer rejected" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Forbidden: Malformed Referer header" }, { status: 403 });
      }
    }
  }

  // 3. Structural Admin Authentication Verification
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin/")) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);

    if (!session) {
      // API route: return 401 JSON
      if (pathname.startsWith("/api/admin/")) {
        return NextResponse.json(
          { error: "Unauthorized: Admin session required" },
          { status: 401 }
        );
      }

      // Admin UI route: redirect to login
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Attach session identity to request headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-admin-username", session.username);
    requestHeaders.set("x-admin-role", session.role);

    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    res.headers.set("x-admin-username", session.username);
    res.headers.set("x-admin-role", session.role);

    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
  ],
};

