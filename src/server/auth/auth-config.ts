import { env } from "@/lib/env";

export const AUTH_COOKIE_NAME = "governit_admin_session";

export const authConfig = {
  adminSecret: env.ADMIN_SECRET,
  cookieName: AUTH_COOKIE_NAME,
  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
};
