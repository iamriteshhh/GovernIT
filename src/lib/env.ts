import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

/**
 * No credential defaults: the old dev defaults were public in git history, so a forgotten .env
 * must fail loudly instead of starting with a known admin password. Copy .env.example to .env.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (see .env.example)"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_SECRET: z.string().min(32, "ADMIN_SECRET must be at least 32 characters (see .env.example)"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters (see .env.example)"),
  ADMIN_USERS: z.string().regex(/^[^:,]+:[^,]{8,}(,[^:,]+:[^,]{8,})*$/, "ADMIN_USERS must be user:password pairs, passwords at least 8 characters"),
  /** Bearer token for /api/cron/check-sources. Unset outside production = scheduled endpoint disabled. */
  CRON_SECRET: isProduction
    ? z.string().min(32, "CRON_SECRET must be at least 32 characters in production")
    : z.string().min(16).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// `next build` imports route modules but never needs secrets; images must not contain them.
// Values present at build time are still validated. Runtime (server start) is always strict.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const schema = isBuildPhase ? (envSchema.partial() as unknown as typeof envSchema) : envSchema;

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  AUTH_SECRET: process.env.AUTH_SECRET,
  ADMIN_USERS: process.env.ADMIN_USERS,
  CRON_SECRET: process.env.CRON_SECRET || undefined,
  NODE_ENV: process.env.NODE_ENV,
});
