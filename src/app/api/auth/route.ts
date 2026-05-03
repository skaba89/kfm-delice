import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, signToken } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

// ============================================
// Zod Schemas
// ============================================

const loginSchema = z.object({
  action: z.literal("login"),
  email: z.string({ message: "L'email est requis" }).email("Format d'email invalide"),
  password: z.string({ message: "Le mot de passe est requis" }).min(6, "Le mot de passe doit contenir au moins 6 caracteres"),
});

const registerSchema = z.object({
  action: z.literal("register"),
  email: z.string({ message: "L'email est requis" }).email("Format d'email invalide"),
  password: z.string({ message: "Le mot de passe est requis" }).min(6, "Le mot de passe doit contenir au moins 6 caracteres"),
  firstName: z.string({ message: "Le prenom est requis" }).min(1, "Le prenom est requis"),
  lastName: z.string({ message: "Le nom est requis" }).min(1, "Le nom est requis"),
  phone: z.string().optional(),
});

// ============================================
// POST /api/auth — Login or Register
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ─── LOGIN ──────────────────────────────
    if (action === "login") {
      // Validate with Zod
      const result = loginSchema.safeParse(body);
      if (!result.success) {
        const firstError = result.error.issues[0];
        return error(firstError?.message || "Donnees invalides", 400);
      }

      const { email, password } = result.data;

      // Rate limiting by email
      const { success: rateOk, retryAfter } = rateLimit(`login:${email}`);
      if (!rateOk) {
        return error(`Trop de tentatives. Reessayez dans ${retryAfter} secondes.`, 429);
      }

      const user = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return error("Email ou mot de passe incorrect", 401);
      }

      if (!user.isActive || user.isLocked) {
        return error("Compte desactive ou bloque", 403);
      }

      const valid = verifyPassword(password, user.passwordHash);
      if (!valid) {
        return error("Email ou mot de passe incorrect", 401);
      }

      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Sign a real JWT token
      const token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Return user (without passwordHash) + JWT token
      const { passwordHash: _, ...userWithoutPassword } = user;
      return success({
        user: userWithoutPassword,
        token,
      });
    }

    // ─── REGISTER ───────────────────────────
    if (action === "register") {
      // Validate with Zod
      const result = registerSchema.safeParse(body);
      if (!result.success) {
        const firstError = result.error.issues[0];
        return error(firstError?.message || "Donnees invalides", 400);
      }

      const { email, password, firstName, lastName, phone } = result.data;

      const existing = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existing) {
        return error("Un compte avec cet email existe deja", 409);
      }

      // Create user
      const user = await db.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: hashPassword(password),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
          role: "CUSTOMER",
          isActive: true,
          isLocked: false,
        },
      });

      // Sign JWT token
      const token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      return success(
        {
          user: userWithoutPassword,
          token,
          message: "Compte cree avec succes !",
        },
        201
      );
    }

    return error("Action invalide. Utilisez 'login' ou 'register'.");
  } catch (err) {
    console.error("[AUTH POST]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// GET /api/auth/me — Verify token & get current user
// ============================================
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Authentification requise", 401);
    }

    const token = authHeader.slice(7);

    // Dynamic import to use verifyToken (which uses jose)
    const { verifyToken } = await import("@/lib/auth");
    const payload = await verifyToken(token);

    if (!payload) {
      return error("Token invalide ou expire", 401);
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        isLocked: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive || user.isLocked) {
      return error("Compte invalide ou desactive", 401);
    }

    return success(user);
  } catch (err) {
    console.error("[AUTH GET /me]", err);
    return error("Erreur interne du serveur", 500);
  }
}
