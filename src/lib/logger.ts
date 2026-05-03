import { NextResponse } from "next/server";
import { error } from "@/lib/api-response";

// ============================================
// Types
// ============================================

type LogLevel = "INFO" | "WARN" | "ERROR" | "API";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

// ============================================
// Color helpers (ANSI escape codes for dev console)
// ============================================

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
} as const;

const isDev = process.env.NODE_ENV === "development";

/** Format a colored log line for console output */
function formatConsoleLine(entry: LogEntry): string {
  const { level, context, message, timestamp } = entry;

  const levelColors: Record<LogLevel, string> = {
    INFO: colors.green,
    WARN: colors.yellow,
    ERROR: colors.red,
    API: colors.magenta,
  };

  const color = levelColors[level] ?? colors.reset;

  const ts = colors.dim + timestamp + colors.reset;
  const lvl = color + level.padEnd(5) + colors.reset;
  const ctx = colors.blue + "[" + context + "]" + colors.reset;

  return `${ts} ${lvl} ${ctx} ${message}`;
}

// ============================================
// Core logging function
// ============================================

function log(entry: LogEntry): void {
  if (isDev) {
    const line = formatConsoleLine(entry);
    switch (entry.level) {
      case "ERROR":
        console.error(line, entry.data ? colors.dim : "", entry.data ?? "");
        break;
      case "WARN":
        console.warn(line, entry.data ? colors.dim : "", entry.data ?? "");
        break;
      default:
        console.log(line, entry.data ? colors.dim : "", entry.data ?? "");
    }
  } else {
    // In production, output structured JSON (can be picked up by log aggregators)
    const output = {
      timestamp: entry.timestamp,
      level: entry.level,
      context: entry.context,
      message: entry.message,
      ...(entry.data ? { data: entry.data } : {}),
    };
    switch (entry.level) {
      case "ERROR":
        console.error(JSON.stringify(output));
        break;
      case "WARN":
        console.warn(JSON.stringify(output));
        break;
      default:
        console.log(JSON.stringify(output));
    }
  }
}

// ============================================
// Public logging functions
// ============================================

/** Log an informational message */
export function logInfo(context: string, message: string, data?: unknown): void {
  log({
    timestamp: new Date().toISOString(),
    level: "INFO",
    context,
    message,
    data,
  });
}

/** Log a warning message */
export function logWarn(context: string, message: string, data?: unknown): void {
  log({
    timestamp: new Date().toISOString(),
    level: "WARN",
    context,
    message,
    data,
  });
}

/** Log an error message */
export function logError(context: string, message: string, data?: unknown): void {
  log({
    timestamp: new Date().toISOString(),
    level: "ERROR",
    context,
    message,
    data,
  });
}

/** Log an API-related message (method + route context) */
export function logApi(
  method: string,
  route: string,
  message: string,
  data?: unknown
): void {
  log({
    timestamp: new Date().toISOString(),
    level: "API",
    context: `${method} ${route}`,
    message,
    data,
  });
}

// ============================================
// API Error Handler
// ============================================

/**
 * Standardized error handler for API route catch blocks.
 * Logs the error with context and returns a standardized error response
 * using the existing `error()` helper from `@/lib/api-response`.
 *
 * @example
 * ```typescript
 * import { apiErrorHandler } from "@/lib/logger";
 *
 * export async function GET(req: NextRequest) {
 *   try {
 *     // ... business logic
 *   } catch (err) {
 *     return apiErrorHandler("ORDERS_GET", err);
 *   }
 * }
 * ```
 */
export function apiErrorHandler(
  context: string,
  err: unknown,
  fallbackMessage = "Internal server error",
  fallbackStatus = 500
): NextResponse {
  const message =
    err instanceof Error ? err.message : fallbackMessage;

  // Log the full error with stack in dev, just message in prod
  const logData = isDev && err instanceof Error
    ? { stack: err.stack, name: err.name }
    : undefined;

  logError(context, message, logData);

  // Use a 500 status for internal errors, 400 for known business errors
  const status = err instanceof Error && message !== fallbackMessage
    ? 400
    : fallbackStatus;

  return error(message, status);
}
