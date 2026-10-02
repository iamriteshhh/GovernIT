import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  DATABASE_URL: isProduction
    ? z.string().min(1, "DATABASE_URL is required in production")
    : z.string().default("postgresql://postgres:postgres@localhost:5432/governit?schema=public"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_SECRET: isProduction
    ? z.string().min(32, "ADMIN_SECRET must be at least 32 characters in production")
    : z.string().default("dev-only-admin-secret-must-be-changed-in-production-min-32-chars"),
  AUTH_SECRET: isProduction
    ? z.string().min(32, "AUTH_SECRET must be at least 32 characters in production")
    : z.string().default("dev-only-auth-session-secret-must-be-changed-in-production-32"),
  ADMIN_USERS: isProduction
    ? z.string().min(3, "ADMIN_USERS (username:password list) is required in production")
    : z.string().default("admin:dev-only-admin-pass-2026,editorial:dev-only-editorial-pass-2026"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  AUTH_SECRET: process.env.AUTH_SECRET,
  ADMIN_USERS: process.env.ADMIN_USERS,
  NODE_ENV: process.env.NODE_ENV,
});
