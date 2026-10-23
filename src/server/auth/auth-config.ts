import { env } from "@/lib/env";
import { edgeSha256Hex, edgeTimingSafeEqual } from "./edge-crypto";

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
          secretHash: edgeSha256Hex(secret),
        });
      }
    }
  }

  return creds;
}

let adminUsersCache: AdminCredential[] | null = null;

export const authConfig = {
  adminSecret: env.ADMIN_SECRET,
  authSecret: env.AUTH_SECRET,
  cookieName: AUTH_COOKIE_NAME,
  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
  /** Parsed on first use, so `next build` (which has no secrets) can import this module. */
  get adminUsers(): AdminCredential[] {
    return (adminUsersCache ??= parseAdminCredentials());
  },
};

/**
 * Validates admin credentials using constant-time comparison
 */
export function verifyAdminCredentials(usernameInput: string, secretKeyInput: string): { valid: boolean; username: string } {
  const normalizedUsername = (usernameInput || "admin").trim().toLowerCase();
  const inputHash = edgeSha256Hex(secretKeyInput);

  const adminUsers = authConfig.adminUsers;

  for (const cred of adminUsers) {
    if (cred.username === normalizedUsername) {
      if (edgeTimingSafeEqual(inputHash, cred.secretHash)) {
        return { valid: true, username: cred.username };
      }
    }
  }

  return { valid: false, username: normalizedUsername };
}
