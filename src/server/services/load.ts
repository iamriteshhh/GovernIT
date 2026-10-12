import { Prisma } from "@prisma/client";

export type LoadError = "DB_UNAVAILABLE" | "LOAD_FAILED";
export type Loaded<T> = { ok: true; data: T } | { ok: false; error: LoadError };

/** Prisma connection-level failures (server down, auth, timeouts). */
export function isDbUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientRustPanicError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) return /^P1\d{3}$/.test(error.code);
  return false;
}

export function classifyLoadError(error: unknown): LoadError {
  return isDbUnavailableError(error) ? "DB_UNAVAILABLE" : "LOAD_FAILED";
}

/**
 * Runs a data load and turns failure into a typed result, so an outage is never
 * rendered as "no opportunities". Logs a one-line, secret-free server message.
 */
export async function load<T>(label: string, fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    const kind = classifyLoadError(error);
    const message = error instanceof Error ? error.message.split("\n").filter(Boolean).pop() : String(error);
    console.error(`[${label}] ${kind}: ${message}`);
    return { ok: false, error: kind };
  }
}

/** JSON error response for API routes: 503 when the database is down, 500 otherwise. */
export function apiFailure(label: string, error: unknown) {
  const kind = classifyLoadError(error);
  const message = error instanceof Error ? error.message.split("\n").filter(Boolean).pop() : String(error);
  console.error(`[${label}] ${kind}: ${message}`);
  return Response.json(
    { error: kind === "DB_UNAVAILABLE" ? "DB_UNAVAILABLE" : "INTERNAL_ERROR" },
    { status: kind === "DB_UNAVAILABLE" ? 503 : 500 }
  );
}
