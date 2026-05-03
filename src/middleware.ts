import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/auth-edge";

/**
 * Next.js Middleware — Route Protection (Edge Runtime compatible)
 *
 * Protected routes (require authentication):
 *   /admin/*     → SUPER_ADMIN, ADMIN, MANAGER, STAFF (vendeurs)
 *   /driver/*    → DRIVER
 *   /kitchen/*   → KITCHEN
 *
 * Public routes (no auth required):
 *   /, /customer/*, /api/customer/menu, /api/auth, /api/public/*
 *
 * Architecture:
 *   POS is at /admin/pos — only accessible to admin & vendeurs (MANAGER, STAFF)
 *   Public menu is at /customer/menu — accessible to everyone
 *   Orders from customers: /customer/* (public)
 *   Orders from POS: /admin/pos (protected)
 */

const PROTECTED_PATHS = ["/admin", "/driver", "/kitchen"];

// Public API paths — used for reference; API auth is handled per-route
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _PUBLIC_API_PATHS = [
  "/api/customer/menu",
  "/api/auth",
  "/api/public/",
  "/api/menu",
  "/api/menu-items",
  "/api/menu-categories",
];

// Roles that can access the admin portal (including POS)
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"];

/**
 * Apply security headers to a response.
 */
function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected path
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isProtected) {
    // Add security headers to all public responses
    return withSecurityHeaders(NextResponse.next());
  }

  // For protected paths, check for auth token
  const token = extractToken(req);

  if (!token) {
    // Redirect to login for page requests, return 401 for API routes
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { success: false, error: "Authentification requise" },
        { status: 401 }
      );
      return withSecurityHeaders(res);
    }

    // For non-API routes, redirect to login page
    const loginUrl = new URL("/customer/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Verify JWT token
  const payload = await verifyToken(token);

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { success: false, error: "Token invalide ou expire" },
        { status: 401 }
      );
      return withSecurityHeaders(res);
    }

    const loginUrl = new URL("/customer/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Role-based access control
  // Admin portal: SUPER_ADMIN, ADMIN, MANAGER (vendeurs), STAFF (caissiers)
  if (pathname.startsWith("/admin") && !ADMIN_ROLES.includes(payload.role)) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/customer/menu", req.url)));
  }
  if (pathname.startsWith("/driver") && payload.role !== "DRIVER") {
    return withSecurityHeaders(NextResponse.redirect(new URL("/customer/menu", req.url)));
  }
  if (pathname.startsWith("/kitchen") && payload.role !== "KITCHEN") {
    return withSecurityHeaders(NextResponse.redirect(new URL("/customer/menu", req.url)));
  }

  // Token is valid, allow the request
  const response = NextResponse.next();
  // Add security headers
  withSecurityHeaders(response);
  // Add noindex for private portals (SEO)
  if (!pathname.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
