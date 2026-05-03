import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// JWT Configuration
// ============================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kfm-delice-dev-fallback-secret-change-in-production"
);
const JWT_EXPIRY = "7d"; // Token valid for 7 days

// ============================================
// Password Hashing
// ============================================

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// ============================================
// JWT Token Management
// ============================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

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
 * Generate a password reset token (for future use)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ============================================
// Order Number Generation
// ============================================

export function generateOrderNumber(): string {
  const now = new Date();
  const ts =
    now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `CMD-${ts}${rand}`;
}

// ============================================
// Deprecated: kept for backward compatibility
// ============================================

/** @deprecated Use signToken() instead */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ============================================
// Auth Middleware for Route Handlers
// ============================================

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
  };
}

type RouteHandler = (
  req: AuthenticatedRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wraps a route handler with JWT authentication check.
 * Verifies the JWT token from Authorization header.
 */
export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }

      const token = authHeader.slice(7);
      const payload = await verifyToken(token);

      if (!payload) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      // Fetch user from DB to ensure still active
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isLocked: true,
        },
      });

      if (!user || !user.isActive || user.isLocked) {
        return NextResponse.json(
          { success: false, error: "Account is deactivated or locked" },
          { status: 403 }
        );
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      return handler(req as AuthenticatedRequest, ctx);
    } catch {
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}

/**
 * Extract user from request (optional auth - won't fail if no token).
 * Verifies JWT and fetches user from DB.
 */
export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  if (!payload) return null;

  return db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      isActive: true,
    },
  });
}

/**
 * Check if user has required role(s).
 * Use inside route handlers after withAuth().
 */
export function hasRole(user: { role: string }, roles: string | string[]): boolean {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(user.role);
}
