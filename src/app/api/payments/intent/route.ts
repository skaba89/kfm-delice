import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { createPaymentIntent } from "@/lib/payments/service";
import { verifyToken } from "@/lib/auth";

// ============================================
// POST /api/payments/intent — Create payment intent
// ============================================
export async function POST(req: NextRequest) {
  try {
    // Auth is optional for guest orders, but preferred
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = await verifyToken(authHeader.slice(7));
      if (payload) userId = payload.userId;
    }

    const body = await req.json();
    const { orderId, amount, method, provider, phoneNumber } = body;

    if (!orderId || !amount || !method) {
      return error("orderId, amount et method sont requis");
    }

    const validMethods = ["cash", "mobile_money", "card"];
    if (!validMethods.includes(method)) {
      return error(`Methode invalide. Options: ${validMethods.join(", ")}`);
    }

    // For mobile money, validate phone
    if (method === "mobile_money" && !phoneNumber) {
      return error("Numero de telephone requis pour Mobile Money");
    }

    const result = await createPaymentIntent({
      orderId,
      amount: parseFloat(amount),
      method,
      provider: provider || null,
      phoneNumber: phoneNumber || null,
    });

    if (!result.success) {
      return error(result.error || "Erreur lors de la creation du paiement", 400);
    }

    return success(result.data, 201);
  } catch (err) {
    console.error("[PAYMENT INTENT POST]", err);
    return error("Erreur interne du serveur", 500);
  }
}
