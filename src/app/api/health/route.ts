import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/health — System health check
// ============================================
export async function GET() {
  const startTime = Date.now();

  // Gather system info (non-async)
  const uptime = process.uptime();
  const nodeVersion = process.version;
  const timestamp = new Date().toISOString();
  const version = "0.2.0";

  const memUsage = process.memoryUsage();
  const memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
  };

  // Test database connectivity
  let database: { status: string; latencyMs?: number; error?: string };

  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    database = {
      status: "connected",
      latencyMs: dbLatency,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Database connection failed";

    database = {
      status: "disconnected",
      error: message,
    };

    // Return 503 if database is unreachable
    return NextResponse.json(
      {
        success: false,
        data: {
          status: "unhealthy",
          timestamp,
          version,
          uptime,
          nodeVersion,
          database,
          memory,
          responseTimeMs: Date.now() - startTime,
        },
      },
      { status: 503 }
    );
  }

  return success({
    status: "healthy",
    timestamp,
    version,
    uptime,
    nodeVersion,
    database,
    memory,
    environment: process.env.NODE_ENV || "development",
    responseTimeMs: Date.now() - startTime,
  });
}
