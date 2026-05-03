import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { handlePaymentWebhook } from "@/lib/payments/service";
import { cinetPayService } from "@/lib/payments/cinetpay";

// ============================================
// POST /api/payments/webhook — Provider webhook callback
// ============================================
// Receives callbacks from CinetPay (card + mobile money).
// Verifies HMAC signature before processing.
//
// CinetPay sends:
// - cpm_trans_id: transaction reference
// - cpm_amount: amount
// - cpm_trans_status: "ACCEPTED" | "PENDING" | "REFUSED"
// - cpm_currency: "XOF"
// - cpm_phone_prefixe: phone prefix
// - cpm_payment_date: payment date
// - signature: HMAC-SHA256 signature
// - payment_method: "CARD" | "MOBILE_MONEY" etc.
// ============================================

export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    let body: Record<string, unknown>;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return error("JSON invalide", 400);
    }

    // ── Signature Verification (CinetPay) ──
    const signature = req.headers.get("x-cinetpay-signature") ||
                      body.signature as string ||
                      "";

    if (cinetPayService.isConfigured() && signature) {
      const isValid = cinetPayService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error("[WEBHOOK] Invalid CinetPay signature - possible tampering");
        // Return 200 anyway to prevent retries, but log the incident
        return success({
          received: true,
          message: "Signature invalide - webhook ignore",
        });
      }
    }

    // ── Parse CinetPay Payload ──
    const parsed = cinetPayService.parseWebhookPayload(body);
    if (parsed) {
      const result = await handlePaymentWebhook({
        provider: "cinetpay",
        transactionId: parsed.transactionId,
        status: parsed.status,
        amount: parsed.amount,
        providerRef: parsed.providerRef,
        metadata: {
          payment_method: parsed.paymentMethod,
          customer_phone: parsed.customerPhone,
          currency: parsed.currency,
          raw_payload: body,
        },
        rawBody,
        signature,
      });

      // Always return 200 to prevent provider retries
      return success({
        received: true,
        message: result.message,
      });
    }

    // ── Fallback: Generic webhook handling ──
    const {
      transaction_id,
      transactionId,
      status,
      amount,
      provider,
      providerRef,
      provider_ref,
      ...metadata
    } = body;

    const txId = transaction_id || transactionId || body.cpm_custom;
    const txStatus = status || body.cpm_trans_status;
    const txAmount = amount ? parseFloat(amount as string) : (body.cpm_amount ? parseFloat(body.cpm_amount as string) : undefined);
    const txProvider = (provider as string) || "cinetpay";
    const txProviderRef = (providerRef as string) || (provider_ref as string);

    if (!txId || !txStatus) {
      return error("transaction_id et status requis", 400);
    }

    const result = await handlePaymentWebhook({
      provider: txProvider,
      transactionId: txId as string,
      status: txStatus as string,
      amount: txAmount,
      providerRef: txProviderRef as string,
      metadata: metadata as Record<string, unknown>,
    });

    // Always return 200 to prevent provider retries
    return success({
      received: true,
      message: result.message,
    });
  } catch (err) {
    console.error("[PAYMENT WEBHOOK POST]", err);
    // Always return 200 to prevent provider retries
    return success({
      received: true,
      message: "Webhook recu (erreur de traitement interne)",
    });
  }
}
