import { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient | PrismaClient;

const toJson = (v: unknown): unknown =>
  v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.map(toJson) : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toJson(x)]))
    : v;

/** Field-level before/after for the keys that actually changed. */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, to] of Object.entries(after)) {
    if (to === undefined) continue;
    const from = before[key];
    if (JSON.stringify(toJson(from)) !== JSON.stringify(toJson(to))) {
      changes[key] = { from: toJson(from), to: toJson(to) };
    }
  }
  return changes;
}

/** Append-only audit record for a material data change. Never pass secrets in `changes`. */
export async function writeAudit(
  entry: { actor: string; action: string; entityType: string; entityId: string; changes?: unknown },
  tx: Tx = db
) {
  await tx.auditLog.create({
    data: {
      actor: entry.actor,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      changes: entry.changes === undefined ? undefined : (toJson(entry.changes) as Prisma.InputJsonValue),
    },
  });
}
