/**
 * Edge-compatible JWT authentication tests.
 *
 * These tests directly import jose functions (Edge Runtime compatible)
 * and do NOT require a database connection or Next.js server.
 *
 * Run: npx vitest run src/__tests__/auth.test.ts
 */

import { SignJWT, jwtVerify } from "jose";

// Replicate the same JWT configuration from auth-edge.ts for testing
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kfm-delice-dev-fallback-secret-change-in-production"
);
const JWT_EXPIRY = "7d";

// ---- Helper functions (mirroring auth-edge.ts) ----

async function signToken(payload: {
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

async function verifyToken(
  token: string
): Promise<{ userId: string; email: string; role: string; iat?: number; exp?: number } | null> {
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

// ============================================
// Tests
// ============================================

describe("JWT Authentication (Edge-compatible)", () => {
  const testUser = {
    userId: "user-123-abc",
    email: "admin@kfmdelice.com",
    role: "ADMIN",
  };

  describe("signToken", () => {
    it("should sign a token with correct user data", async () => {
      const token = await signToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      // JWT format: header.payload.signature (3 parts separated by dots)
      expect(token.split(".")).toHaveLength(3);
    });

    it("should produce different tokens for different users", async () => {
      const token1 = await signToken(testUser);
      const token2 = await signToken({
        userId: "user-456-xyz",
        email: "customer@kfmdelice.com",
        role: "CUSTOMER",
      });

      expect(token1).not.toBe(token2);
    });

    it("should produce tokens that are valid JWTs", async () => {
      const token = await signToken(testUser);
      // JWT format: header.payload.signature
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token and return correct payload", async () => {
      const token = await signToken(testUser);
      const payload = await verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(testUser.userId);
      expect(payload!.email).toBe(testUser.email);
      expect(payload!.role).toBe(testUser.role);
      expect(payload!.iat).toBeDefined();
      expect(typeof payload!.iat).toBe("number");
      expect(payload!.exp).toBeDefined();
      expect(typeof payload!.exp).toBe("number");
    });

    it("should return null for an expired token", async () => {
      // Create a token that already expired (exp set to past)
      const expiredToken = await new SignJWT({
        userId: testUser.userId,
        email: testUser.email,
        role: testUser.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1s") // expires in 1 second
        .sign(JWT_SECRET);

      // Wait for it to expire
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const payload = await verifyToken(expiredToken);
      expect(payload).toBeNull();
    });

    it("should return null for a tampered token", async () => {
      const token = await signToken(testUser);

      // Tamper with the payload (modify a character in the middle segment)
      const parts = token.split(".");
      const tamperedPayload = Buffer.from(parts[1], "base64url")
        .toString()
        .replace(testUser.role, "HACKER");
      parts[1] = Buffer.from(tamperedPayload).toString("base64url");
      const tamperedToken = parts.join(".");

      const payload = await verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });

    it("should return null for a completely invalid token string", async () => {
      const payload = await verifyToken("not-a-valid-jwt-token");
      expect(payload).toBeNull();
    });

    it("should return null for an empty string", async () => {
      const payload = await verifyToken("");
      expect(payload).toBeNull();
    });

    it("should return null for a token signed with a different secret", async () => {
      const wrongSecret = new TextEncoder().encode("wrong-secret-key");

      const wrongToken = await new SignJWT({
        userId: testUser.userId,
        email: testUser.email,
        role: testUser.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(wrongSecret);

      const payload = await verifyToken(wrongToken);
      expect(payload).toBeNull();
    });

    it("should handle all user roles correctly", async () => {
      const roles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "KITCHEN", "DRIVER", "CUSTOMER"];

      for (const role of roles) {
        const token = await signToken({ ...testUser, role });
        const payload = await verifyToken(token);
        expect(payload).not.toBeNull();
        expect(payload!.role).toBe(role);
      }
    });
  });

  describe("sign + verify round-trip", () => {
    it("should preserve all fields through sign → verify cycle", async () => {
      const token = await signToken(testUser);
      const payload = await verifyToken(token);

      expect(payload).toEqual(
        expect.objectContaining({
          userId: testUser.userId,
          email: testUser.email,
          role: testUser.role,
        })
      );
    });

    it("should not include sensitive fields in the JWT body", async () => {
      const token = await signToken(testUser);
      const payloadPart = token.split(".")[1];
      const decoded = JSON.parse(Buffer.from(payloadPart, "base64url").toString());

      // Should NOT contain password or other sensitive fields
      expect(decoded).not.toHaveProperty("password");
      expect(decoded).not.toHaveProperty("passwordHash");
      // Should contain the expected fields
      expect(decoded).toHaveProperty("userId");
      expect(decoded).toHaveProperty("email");
      expect(decoded).toHaveProperty("role");
    });
  });
});
