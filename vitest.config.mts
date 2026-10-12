import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnv } from "vite";

/** Test-only credentials: tests never read or need the real admin/cron secrets from .env. */
const TEST_SECRETS = {
  ADMIN_SECRET: "test-only-admin-secret-0123456789abcdef",
  AUTH_SECRET: "test-only-auth-secret-0123456789abcdefgh",
  ADMIN_USERS: "admin:test-only-admin-pass,editorial:test-only-editorial-pass",
  CRON_SECRET: "test-only-cron-secret-0123456789abcdef",
};

export default defineConfig(({ mode }) => {
  // DATABASE_URL (and other non-secret settings) still come from .env.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    test: {
      globals: true,
      environment: "node",
      env: { ...env, ...TEST_SECRETS },
      // Integration tests share one database; run files one at a time.
      fileParallelism: false,
      testTimeout: 30_000,
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});
