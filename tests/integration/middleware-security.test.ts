import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy as middleware } from "@/proxy";
import { createSessionToken } from "@/server/auth/session";
import { AUTH_COOKIE_NAME } from "@/server/auth/auth-config";

describe("Middleware Structural Route Protection & CSRF Defense", () => {
  it("should allow public access to /admin/login without redirection", () => {
    const req = new NextRequest("http://localhost:3000/admin/login");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("should redirect unauthenticated access to /admin to /admin/login", () => {
    const req = new NextRequest("http://localhost:3000/admin");
    const res = middleware(req);

    // Redirect status 307
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/admin/login");
  });

  it("should reject unauthenticated request to /api/admin/exams with 401 JSON", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/exams", {
      method: "POST",
    });
    const res = middleware(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Admin session required");
  });

  it("should reject forged / tampered session cookies on protected routes", () => {
    const validToken = createSessionToken("admin");
    const tampered = validToken.slice(0, -6) + "123456";

    const req = new NextRequest("http://localhost:3000/admin", {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${tampered}`,
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("should allow authenticated requests with valid session cookie", () => {
    const validToken = createSessionToken("editorial");
    const req = new NextRequest("http://localhost:3000/admin", {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${validToken}`,
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-admin-username")).toBe("editorial");
  });

  it("should block cross-origin state-changing requests (CSRF Defense)", async () => {
    const validToken = createSessionToken("admin");
    const req = new NextRequest("http://localhost:3000/api/admin/verify", {
      method: "POST",
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${validToken}`,
        origin: "https://evil-attacker-site.com",
        host: "localhost:3000",
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Cross-origin request rejected");
  });
});
