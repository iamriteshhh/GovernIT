import crypto from "crypto";
import { env } from "@/lib/env";

export const AUTH_COOKIE_NAME = "governit_admin_session";

export interface AdminCredential {
  username: string;
  secretHash: string; // SHA-256 hash of secret for constant-time comparison
}

function parseAdminCredentials(): AdminCredential[] {
  const usersStr = env.ADMIN_USERS || "";
  const creds: AdminCredential[] = [];

  const pairs = usersStr.split(",").map((s) => s.trim()).filter(Boolean);
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx > 0) {
      const username = pair.substring(0, colonIdx).trim().toLowerCase();
      const secret = pair.substring(colonIdx + 1).trim();
      if (username && secret) {
        creds.push({
          username,
          secretHash: crypto.createHash("sha256").update(secret).digest("hex"),
        });
      }
    }
  }

  // Also include the primary admin user if not already defined
  const primaryHash = crypto.createHash("sha256").update(env.ADMIN_SECRET).digest("hex");
  if (!creds.some((c) => c.username === "admin")) {
    creds.push({
      username: "admin",
      secretHash: primaryHash,
    });
  }

  return creds;
}

export const authConfig = {
  adminSecret: env.ADMIN_SECRET,
  authSecret: env.AUTH_SECRET,
  cookieName: AUTH_COOKIE_NAME,
  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
  adminUsers: parseAdminCredentials(),
};

/**
 * Validates admin credentials using constant-time comparison
 */
export function verifyAdminCredentials(usernameInput: string, secretKeyInput: string): { valid: boolean; username: string } {
  const normalizedUsername = (usernameInput || "admin").trim().toLowerCase();
  const inputHash = crypto.createHash("sha256").update(secretKeyInput).digest("hex");
  const inputHashBuf = Buffer.from(inputHash, "utf-8");

  const adminUsers = authConfig.adminUsers;

  for (const cred of adminUsers) {
    if (cred.username === normalizedUsername) {
      const expectedHashBuf = Buffer.from(cred.secretHash, "utf-8");
      if (inputHashBuf.length === expectedHashBuf.length && crypto.timingSafeEqual(inputHashBuf, expectedHashBuf)) {
        return { valid: true, username: cred.username };
      }
    }
  }

  // If username wasn't specified or was "admin", check against adminSecret directly
  const defaultAdminHash = crypto.createHash("sha256").update(authConfig.adminSecret).digest("hex");
  const defaultHashBuf = Buffer.from(defaultAdminHash, "utf-8");
  if (normalizedUsername === "admin" && inputHashBuf.length === defaultHashBuf.length && crypto.timingSafeEqual(inputHashBuf, defaultHashBuf)) {
    return { valid: true, username: "admin" };
  }

  return { valid: false, username: normalizedUsername };
}
