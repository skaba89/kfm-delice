import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { processPayment } from "@/lib/payments/service";

// ============================================
// POST /api/payments/process — Process a payment
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, method, provider, phoneNumber } = body;

    if (!paymentId || !method) {
      return error("paymentId et method sont requis");
    }

    const result = await processPayment({
      paymentId,
      method,
      provider: provider || null,
      phoneNumber: phoneNumber || null,
    });

    if (result.success) {
      return success({
        paymentId: result.paymentId,
        transactionId: result.transactionId,
        status: result.status,
        amount: result.amount,
        message: result.message,
        providerRef: result.providerRef,
      });
    } else {
      return error(result.message, 400);
    }
  } catch (err) {
    console.error("[PAYMENT PROCESS POST]", err);
    return error("Erreur interne du serveur", 500);
  }
}
