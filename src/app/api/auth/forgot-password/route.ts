import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth";

// ============================================
// POST /api/auth/forgot-password — Request password reset
//
// In a real production app, this would send an email.
// For now, we store a reset token in the user's email field
// placeholder and return success (simulated flow).
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return error("Email requis");
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    // In production, send reset email here
    return success({
      message: "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.",
    });
  } catch (err) {
    console.error("[AUTH FORGOT PASSWORD]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// PUT /api/auth/forgot-password — Reset password
// ============================================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    // ⚠️ SECURITY WARNING: This endpoint currently resets the password using only
    // an email address with NO reset token verification. In production, this MUST
    // be replaced with a proper token-based reset flow (e.g., verify a signed JWT
    // or one-time token sent via email before allowing the password change).
    // Without token verification, any attacker who knows a user's email can reset
    // their password.

    if (!email || !newPassword) {
      return error("Email et nouveau mot de passe requis");
    }

    if (newPassword.length < 6) {
      return error("Le mot de passe doit contenir au moins 6 caracteres");
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return error("Aucun compte trouve avec cet email", 404);
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return success({ message: "Mot de passe modifie avec succes !" });
  } catch (err) {
    console.error("[AUTH RESET PASSWORD]", err);
    return error("Erreur interne du serveur", 500);
  }
}
