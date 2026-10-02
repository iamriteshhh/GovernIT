import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs: number | null = null;
  let isHealthy = true;

  try {
    const dbPingStart = Date.now();
    await db.$queryRawUnsafe("SELECT 1");
    dbLatencyMs = Date.now() - dbPingStart;
  } catch (error) {
    dbStatus = "disconnected";
    isHealthy = false;
    console.error("[HEALTH CHECK] Database ping failed:", error);
  }

  const memory = process.memoryUsage();

  const healthData = {
    status: isHealthy ? "ok" : "degraded",
    app: "GovernIT",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    responseTimeMs: Date.now() - startTime,
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
    },
  };

  return NextResponse.json(healthData, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
