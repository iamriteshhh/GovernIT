import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "@/server/auth/session";
import { POST as loginHandler } from "@/app/api/admin/login/route";
import { POST as verifyHandler } from "@/app/api/admin/verify/route";
import { NextRequest } from "next/server";
import { authConfig } from "@/server/auth/auth-config";

describe("Phase 8 - Admin Authentication and Authorization", () => {
  it("should create and verify a valid HMAC session token", () => {
    const token = createSessionToken();
    expect(token).toBeTruthy();
    expect(token.includes(".")).toBe(true);

    const isValid = verifySessionToken(token);
    expect(isValid).not.toBeNull();
    expect(isValid?.role).toBe("admin");
  });

  it("should reject tampered or invalid session tokens", () => {
    const token = createSessionToken();
    const tampered = token + "bad_signature";
    expect(verifySessionToken(tampered)).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken(null)).toBeNull();
    expect(verifySessionToken("invalid.token.parts")).toBeNull();
  });

  it("should reject login with invalid admin secret", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ secretKey: "wrong-password" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it("should succeed login with correct admin secret and set cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", secretKey: "test-only-admin-pass" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const cookies = res.cookies.get(authConfig.cookieName);
    expect(cookies).toBeDefined();
    expect(cookies?.value).toBeTruthy();
    expect(verifySessionToken(cookies?.value)).toBeTruthy();
  });

  it("should reject unauthenticated verification attempts", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/verify", {
      method: "POST",
      body: JSON.stringify({ notes: "Unauthenticated attempt" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await verifyHandler(req);
    expect(res.status).toBe(401);
  });
});
