/**
 * Edge-compatible authentication utilities for middleware.
 *
 * This module ONLY uses `jose` (Edge Runtime compatible).
 * It does NOT import: crypto, bcryptjs, or @prisma/client.
 *
 * For full auth features (password hashing, DB lookups, withAuth),
 * use `@/lib/auth.ts` in server-side API routes and Server Components.
 */

import { SignJWT, jwtVerify } from "jose";

// ============================================
// JWT Configuration
// ============================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kfm-delice-dev-fallback-secret-change-in-production"
);
const JWT_EXPIRY = "7d";

// ============================================
// Types
// ============================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ============================================
// JWT Token Management (Edge-safe)
// ============================================

/**
 * Sign a JWT token with user data.
 * Uses jose (Edge-compatible) instead of jsonwebtoken.
 */
export async function signToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token.
 * Returns the payload if valid, null otherwise.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * Extract JWT token from a request (cookie or Authorization header).
 */
export function extractToken(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
  headers: { get: (name: string) => string | null };
}): string | null {
  const tokenFromCookie = request.cookies.get("kfm_token")?.value;
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  return tokenFromCookie || tokenFromHeader || null;
}
