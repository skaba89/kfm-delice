import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { checkPaymentStatus } from "@/lib/payments/service";

// ============================================
// GET /api/payments/status?id=xxx — Check payment status
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("id");
    const transactionId = searchParams.get("transactionId");

    if (!paymentId && !transactionId) {
      return error("Parametre 'id' ou 'transactionId' requis");
    }

    // For transactionId lookup, we'd need to add that to the service
    // For now, use payment ID
    const result = await checkPaymentStatus(paymentId || "");

    if (!result.success) {
      return error(result.error || "Paiement introuvable", 404);
    }

    return success(result.data);
  } catch (err) {
    console.error("[PAYMENT STATUS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
