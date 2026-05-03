// ============================================
// Environment Variable Validation
// ============================================
// Validates all required environment variables at module load time
// and exports a typed `env` object for safe access throughout the app.

// ============================================
// Type definitions
// ============================================

interface EnvConfig {
  /** PostgreSQL connection string */
  DATABASE_URL: string;
  /** Secret key for JWT signing (minimum 16 characters) */
  JWT_SECRET: string;
  /** Public-facing app URL (default: http://localhost:3000) */
  NEXT_PUBLIC_APP_URL: string;
  /** CinetPay site ID for payment integration */
  CINETPAY_SITE_ID: string;
  /** CinetPay API secret key */
  CINETPAY_API_KEY: string;
  /** Node environment (development | production | test) */
  NODE_ENV: string;
}

// ============================================
// Validation helpers
// ============================================

function getOrThrow(key: string, description: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[ENV] Missing required environment variable: ${key} (${description}). ` +
      `Please set it in your .env file.`
    );
  }
  return value.trim();
}

function getWithDefault(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    return defaultValue;
  }
  return value.trim();
}

// ============================================
// Validation (runs at import time)
// ============================================

const requiredVars: Array<{ key: string; description: string }> = [
  { key: "DATABASE_URL", description: "PostgreSQL connection string" },
  { key: "JWT_SECRET", description: "Secret key for JWT token signing" },
];

const optionalVars: Array<{ key: string; description: string; defaultValue: string }> = [
  { key: "NEXT_PUBLIC_APP_URL", description: "Public-facing app URL", defaultValue: "http://localhost:3000" },
  { key: "CINETPAY_SITE_ID", description: "CinetPay payment site ID", defaultValue: "" },
  { key: "CINETPAY_API_KEY", description: "CinetPay payment API key", defaultValue: "" },
  { key: "NODE_ENV", description: "Node.js environment", defaultValue: "development" },
];

// Validate required variables
const validated: Record<string, string> = {};

for (const { key, description } of requiredVars) {
  const value = getOrThrow(key, description);

  // Extra validation for JWT_SECRET
  if (key === "JWT_SECRET" && value.length < 16) {
    throw new Error(
      `[ENV] JWT_SECRET must be at least 16 characters long for security. ` +
      `Current length: ${value.length}. Generate one with: openssl rand -hex 24`
    );
  }

  validated[key] = value;
}

// Apply optional variables with defaults
for (const { key, defaultValue } of optionalVars) {
  validated[key] = getWithDefault(key, defaultValue);
}

// ============================================
// Exported typed env object
// ============================================

/**
 * Typed, validated environment variables.
 * Access these instead of `process.env.*` throughout the app.
 *
 * @example
 * ```typescript
 * import { env } from "@/lib/env";
 *
 * const url = env.NEXT_PUBLIC_APP_URL;
 * const secret = env.JWT_SECRET;
 * ```
 */
export const env = validated as unknown as EnvConfig;

// ============================================
// Utility: check if payment is configured
// ============================================

/** Returns true if CinetPay credentials are configured */
export function isPaymentConfigured(): boolean {
  return !!(env.CINETPAY_SITE_ID && env.CINETPAY_API_KEY);
}

/** Returns true if running in development mode */
export function isDev(): boolean {
  return env.NODE_ENV === "development";
}
