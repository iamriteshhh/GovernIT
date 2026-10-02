import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRateLimiter } from "@/server/auth/rate-limiter";
import { verifyAdminCredentials } from "@/server/auth/auth-config";
import { createSessionToken, verifySessionToken } from "@/server/auth/session";

describe("Group 1: Security Foundations", () => {
  describe("Rate Limiting & Lockout Engine", () => {
    let limiter: InMemoryRateLimiter;

    beforeEach(() => {
      limiter = new InMemoryRateLimiter({
        maxAttempts: 3,
        windowMs: 1000,
        lockoutMs: 2000,
      });
    });

    it("should allow attempts up to maxAttempts threshold", () => {
      const key = "test-ip-1";
      expect(limiter.check(key).allowed).toBe(true);

      const res1 = limiter.recordFailure(key);
      expect(res1.isLocked).toBe(false);
      expect(res1.remainingAttempts).toBe(2);

      const res2 = limiter.recordFailure(key);
      expect(res2.isLocked).toBe(false);
      expect(res2.remainingAttempts).toBe(1);
    });

    it("should lock out client on N+1 failed attempt", () => {
      const key = "test-ip-2";
      limiter.recordFailure(key);
      limiter.recordFailure(key);
      const res3 = limiter.recordFailure(key);

      expect(res3.isLocked).toBe(true);
      expect(res3.remainingAttempts).toBe(0);
      expect(res3.retryAfterSeconds).toBeGreaterThan(0);

      // Subsequent check must be rejected
      const check = limiter.check(key);
      expect(check.allowed).toBe(false);
      expect(check.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("should reset rate limit tracking upon successful login", () => {
      const key = "test-ip-3";
      limiter.recordFailure(key);
      limiter.recordFailure(key);
      limiter.recordSuccess(key);

      const check = limiter.check(key);
      expect(check.allowed).toBe(true);
      expect(check.remainingAttempts).toBe(3);
    });
  });

  describe("Per-Admin Identity & Timing-Safe Verification", () => {
    it("should authenticate allowed primary admin", () => {
      const result = verifyAdminCredentials("admin", "dev-only-admin-pass-2026");
      expect(result.valid).toBe(true);
      expect(result.username).toBe("admin");
    });

    it("should authenticate secondary editorial admin independently", () => {
      const result = verifyAdminCredentials("editorial", "dev-only-editorial-pass-2026");
      expect(result.valid).toBe(true);
      expect(result.username).toBe("editorial");
    });

    it("should reject invalid passwords in constant-time", () => {
      const result = verifyAdminCredentials("admin", "wrong-password-attempt");
      expect(result.valid).toBe(false);
    });

    it("should reject non-existent admin accounts", () => {
      const result = verifyAdminCredentials("hacker", "some-password");
      expect(result.valid).toBe(false);
    });
  });

  describe("Session Token & Identity Attribution", () => {
    it("should embed admin username in signed session token and verify accurately", () => {
      const token = createSessionToken("editorial");
      const session = verifySessionToken(token);

      expect(session).not.toBeNull();
      expect(session?.role).toBe("admin");
      expect(session?.username).toBe("editorial");
    });

    it("should reject forged or tampered session tokens", () => {
      const token = createSessionToken("admin");
      const [payload, sig] = token.split(".");
      const forgedToken = `${payload}.${sig.slice(0, -4)}abcd`;

      const session = verifySessionToken(forgedToken);
      expect(session).toBeNull();
    });

    it("should reject empty or malformed tokens", () => {
      expect(verifySessionToken("")).toBeNull();
      expect(verifySessionToken("invalid-format")).toBeNull();
      expect(verifySessionToken(null)).toBeNull();
    });
  });
});
