// ============================================
// KFM Delice — Payment Service
// Handles payment processing for all methods:
// - Cash (COD / in-restaurant)
// - Mobile Money via CinetPay (Orange Money, Wave, Free Money, MTN MoMo)
// - Card via CinetPay (Visa, Mastercard)
// ============================================

import { db } from "@/lib/db";
import crypto from "crypto";
import {
  type PaymentMethod,
  type MobileMoneyProvider,
  type PaymentResult,
  type PaymentStatus,
  PAYMENT_INTENT_EXPIRY_MS,
  cleanPhoneNumber,
} from "./types";
import { cinetPayService } from "./cinetpay";

// ============================================
// Payment Intent — Create
// ============================================

/**
 * Create a payment intent for an order.
 * This should be called before the actual payment processing.
 */
export async function createPaymentIntent(params: {
  orderId: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  provider?: MobileMoneyProvider | null;
  phoneNumber?: string | null;
}): Promise<{
  success: boolean;
  data?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    expiresAt: string;
    paymentUrl?: string | null;
  };
  error?: string;
}> {
  const {
    orderId,
    amount,
    currency = "XOF",
    method,
    provider,
    phoneNumber,
  } = params;

  // Verify order exists and is in correct state
  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return { success: false, error: "Commande introuvable" };
  }

  // Verify amount matches order total (allow small rounding differences)
  if (Math.abs(amount - order.total) > 50) {
    console.warn(`[PAYMENT INTENT] Amount mismatch: client=${amount}, order=${order.total}`);
    // Use order total instead of client amount to avoid rounding issues
  }

  // Check if payment already exists and is PAID
  const existingPayment = await db.payment.findFirst({
    where: { orderId, status: "PAID" },
  });
  if (existingPayment) {
    return { success: false, error: "Cette commande est deja payee" };
  }

  // Check if a PENDING/PROCESSING payment already exists for this order
  const pendingPayment = await db.payment.findFirst({
    where: { orderId, status: { in: ["PENDING", "PROCESSING"] } },
  });
  if (pendingPayment) {
    // Return existing payment instead of creating a duplicate
    return {
      success: true,
      data: {
        id: pendingPayment.id,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
        status: pendingPayment.status,
        expiresAt: new Date(Date.now() + PAYMENT_INTENT_EXPIRY_MS).toISOString(),
        paymentUrl: (pendingPayment.metadata as Record<string, unknown>)?.paymentUrl as string | null || null,
      },
    };
  }

  // Generate transaction ID
  const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(8).toString("hex").slice(0, 8)}`;
  const expiresAt = new Date(Date.now() + PAYMENT_INTENT_EXPIRY_MS);

  // Use order.total to avoid client-server rounding differences
  const finalAmount = order.total;

  // Determine initial status and payment URL
  let initialStatus: PaymentStatus = "PENDING";
  let paymentUrl: string | null = null;

  if (method === "cash") {
    // Cash: mark directly as PAID (COD - collected on delivery/spot)
    initialStatus = "PAID";
  } else if (method === "card" || method === "mobile_money") {
    // Card and Mobile Money: create CinetPay session
    if (cinetPayService.isConfigured()) {
      try {
        const cpResult = await cinetPayService.createPayment({
          transactionId,
          amount: Math.round(finalAmount),
          currency,
          description: `Commande ${order.orderNumber} - KFM Delice`,
          customerName: order.customerName,
          customerPhone: order.customerPhone || phoneNumber || "",
          customerEmail: order.customerEmail || "",
          notifyUrl: `${process.env.CINETPAY_NOTIFY_URL || "/api/payments/webhook"}`,
          returnUrl: process.env.CINETPAY_RETURN_URL || "/customer/orders",
          channels: method === "mobile_money"
            ? mapProviderToCinetPayChannel(provider)
            : "CARD",
        });

        if (cpResult.success && cpResult.paymentUrl) {
          paymentUrl = cpResult.paymentUrl;
          initialStatus = "PENDING";
        } else {
          console.error("[CINETPAY] Failed to create payment session:", cpResult.error);
          // Fallback: continue with local processing
          initialStatus = "PROCESSING";
        }
      } catch (err) {
        console.error("[CINETPAY] Error creating payment:", err);
        initialStatus = "PROCESSING";
      }
    } else {
      // CinetPay not configured — simulate for development
      initialStatus = "PROCESSING";
    }
  }

  // Clean phone number if provided
  const cleanedPhone = phoneNumber ? cleanPhoneNumber(phoneNumber) : null;

  // Create payment record
  const orderData = await db.order.findUnique({ where: { id: orderId }, select: { restaurantId: true } });
  const payment = await db.payment.create({
    data: {
      restaurantId: orderData?.restaurantId || "",
      orderId,
      amount: finalAmount,
      currency,
      method: method === "mobile_money" ? "MOBILE_MONEY" : method === "card" ? "CARD" : "CASH",
      provider: provider || (method === "card" ? "cinetpay" : null),
      phoneNumber: cleanedPhone || null,
      status: initialStatus,
      transactionId,
      processedAt: initialStatus === "PAID" ? new Date() : null,
      metadata: {
        paymentUrl,
        createdAt: new Date().toISOString(),
        method,
        provider,
      },
    },
  });

  return {
    success: true,
    data: {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      expiresAt: expiresAt.toISOString(),
      paymentUrl,
    },
  };
}

// ============================================
// Payment Processing
// ============================================

/**
 * Process a payment based on method.
 * For cash: immediately mark as PAID.
 * For mobile money/card via CinetPay: redirect to payment page.
 * Without CinetPay: simulate processing for development.
 */
export async function processPayment(params: {
  paymentId: string;
  method: PaymentMethod;
  provider?: MobileMoneyProvider | null;
  phoneNumber?: string | null;
}): Promise<PaymentResult> {
  const { paymentId, method, provider, phoneNumber } = params;

  // Find payment
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) {
    return {
      success: false,
      paymentId,
      transactionId: null,
      status: "FAILED",
      amount: 0,
      message: "Paiement introuvable",
    };
  }

  // Don't re-process completed payments
  if (payment.status === "PAID") {
    return {
      success: true,
      paymentId,
      transactionId: payment.transactionId,
      status: "PAID",
      amount: payment.amount,
      message: "Paiement deja confirme",
    };
  }

  try {
    let result: PaymentResult;

    switch (method) {
      case "cash":
        result = await processCashPayment(payment.id, payment.orderId);
        break;

      case "mobile_money":
        result = await processMobileMoneyPayment(
          payment.id,
          payment.orderId,
          provider,
          phoneNumber
        );
        break;

      case "card":
        result = await processCardPayment(payment.id, payment.orderId);
        break;

      default:
        result = {
          success: false,
          paymentId,
          transactionId: null,
          status: "FAILED",
          amount: payment.amount,
          message: "Methode de paiement non supportee",
        };
    }

    // Update order payment status based on result
    if (result.success) {
      await db.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "PAID" },
      });

      // Add status history entry
      await db.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: payment.order.status === "PENDING" ? "CONFIRMED" : payment.order.status,
          notes: `Paiement ${getPaymentMethodLabel(method)} confirme (${formatAmount(payment.amount)})`,
        },
      });
    }

    return result;
  } catch (err) {
    console.error("[PAYMENT PROCESSING ERROR]", err);

    // Mark payment as failed
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureReason: "Erreur interne du serveur",
      },
    });

    return {
      success: false,
      paymentId,
      transactionId: null,
      status: "FAILED",
      amount: payment.amount,
      message: "Erreur lors du traitement du paiement",
    };
  }
}

// ============================================
// Cash Payment
// ============================================

async function processCashPayment(
  paymentId: string,
  orderId: string
): Promise<PaymentResult> {
  // Cash is always "successful" — money collected on delivery/spot
  const payment = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      processedAt: new Date(),
      collectedBy: "cash_on_delivery",
    },
  });

  return {
    success: true,
    paymentId,
    transactionId: payment.transactionId,
    status: "PAID",
    amount: payment.amount,
    message: "Paiement en especes enregistre. A regler a la livraison ou au restaurant.",
  };
}

// ============================================
// Mobile Money Payment (via CinetPay)
// ============================================

async function processMobileMoneyPayment(
  paymentId: string,
  orderId: string,
  provider?: MobileMoneyProvider | null,
  phoneNumber?: string | null
): Promise<PaymentResult> {
  if (!phoneNumber) {
    return {
      success: false,
      paymentId,
      transactionId: null,
      status: "FAILED",
      amount: 0,
      message: "Numero de telephone requis pour Mobile Money",
    };
  }

  const providerName = getProviderName(provider);

  // Update payment with phone and provider
  await db.payment.update({
    where: { id: paymentId },
    data: {
      provider: provider || "orange_money",
      phoneNumber: cleanPhoneNumber(phoneNumber),
      status: "PROCESSING",
    },
  });

  // ── CinetPay Integration ──
  // If CinetPay is configured, the payment was already initiated
  // in createPaymentIntent(). The customer will complete payment
  // on the CinetPay page, and the webhook will confirm it.
  //
  // For development without CinetPay, we simulate a successful payment.

  if (cinetPayService.isConfigured()) {
    // Payment URL should already be set in createPaymentIntent
    // Return a "pending" result — the webhook will finalize it
    const existingPayment = await db.payment.findUnique({ where: { id: paymentId } });

    return {
      success: true,
      paymentId,
      transactionId: existingPayment?.transactionId || null,
      status: "PROCESSING",
      amount: existingPayment?.amount || 0,
      message: `Redirection vers ${providerName} en cours... Completez le paiement sur la page qui va s'ouvrir.`,
      providerRef: (existingPayment?.metadata as Record<string, unknown>)?.paymentUrl as string | null,
    };
  }

  // ── Development Mode (no CinetPay configured) ──
  // Simulate a successful payment after a brief delay
  console.log(`[PAYMENT SIMULATION] Simulating ${providerName} payment for ${paymentId}`);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const simulatedProviderRef = `REF-${provider || "om"}-${Date.now()}`;

  const updatedPayment = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      processedAt: new Date(),
      providerRef: simulatedProviderRef,
      metadata: {
        simulated: true,
        simulatedAt: new Date().toISOString(),
      },
    },
  });

  return {
    success: true,
    paymentId,
    transactionId: updatedPayment.transactionId,
    status: "PAID",
    amount: updatedPayment.amount,
    message: `[DEV] Paiement via ${providerName} simule avec succes.`,
    providerRef: simulatedProviderRef,
  };
}

// ============================================
// Card Payment (via CinetPay)
// ============================================

async function processCardPayment(
  paymentId: string,
  orderId: string
): Promise<PaymentResult> {
  if (cinetPayService.isConfigured()) {
    // Payment URL should already be set in createPaymentIntent
    // Return a "pending" result — the webhook will finalize it
    const existingPayment = await db.payment.findUnique({ where: { id: paymentId } });

    return {
      success: true,
      paymentId,
      transactionId: existingPayment?.transactionId || null,
      status: "PROCESSING",
      amount: existingPayment?.amount || 0,
      message: "Redirection vers la page de paiement securise...",
      providerRef: (existingPayment?.metadata as Record<string, unknown>)?.paymentUrl as string | null,
    };
  }

  // ── Development Mode (no CinetPay configured) ──
  console.log(`[PAYMENT SIMULATION] Simulating card payment for ${paymentId}`);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const simulatedProviderRef = `REF-CARD-${Date.now()}`;

  const updatedPayment = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      processedAt: new Date(),
      providerRef: simulatedProviderRef,
      metadata: {
        integration: "cinetpay",
        sandbox: true,
        simulated: true,
        note: "Replace with actual CinetPay integration in production",
      },
    },
  });

  return {
    success: true,
    paymentId,
    transactionId: updatedPayment.transactionId,
    status: "PAID",
    amount: updatedPayment.amount,
    message: "[DEV] Paiement par carte simule avec succes.",
    providerRef: simulatedProviderRef,
  };
}

// ============================================
// Webhook — Handle provider callbacks
// ============================================

/**
 * Handle webhook callback from payment provider.
 * Used by CinetPay (handles card + mobile money).
 * Includes HMAC signature verification.
 */
export async function handlePaymentWebhook(params: {
  provider: string;
  transactionId: string;
  status: string;
  amount?: number;
  providerRef?: string;
  metadata?: Record<string, unknown>;
  rawBody?: string;
  signature?: string;
}): Promise<{ success: boolean; message: string }> {
  const { provider, transactionId, status, amount, providerRef, metadata } = params;

  // Verify CinetPay signature if provided
  if (provider === "cinetpay" && params.signature && params.rawBody) {
    const isValid = cinetPayService.verifyWebhookSignature(
      params.rawBody,
      params.signature
    );
    if (!isValid) {
      console.error("[WEBHOOK] Invalid CinetPay signature");
      return { success: false, message: "Signature invalide" };
    }
  }

  // Find payment by transaction ID
  const payment = await db.payment.findUnique({
    where: { transactionId },
  });

  if (!payment) {
    return { success: false, message: "Transaction introuvable" };
  }

  // Verify amount matches (prevent tampering)
  if (amount !== undefined && Math.abs(amount - payment.amount) > 1) {
    console.error(`[WEBHOOK] Amount mismatch: expected ${payment.amount}, got ${amount}`);
    return { success: false, message: "Montant incorrect" };
  }

  // Map provider status to our status
  const statusMap: Record<string, PaymentStatus> = {
    success: "PAID",
    completed: "PAID",
    confirmed: "PAID",
    ACCEPTED: "PAID",
    failed: "FAILED",
    cancelled: "FAILED",
    expired: "FAILED",
    REFUSED: "FAILED",
    pending: "PENDING",
    PENDING: "PENDING",
  };

  const newStatus = statusMap[status] || statusMap[status.toUpperCase()] || payment.status;

  // Don't update if already in a terminal state
  if (payment.status === "PAID" || payment.status === "REFUNDED") {
    return { success: true, message: `Paiement deja en etat ${payment.status}` };
  }

  // Build updated metadata
  const existingMeta = (payment.metadata || {}) as Record<string, unknown>;
  const updatedMeta = {
    ...existingMeta,
    webhook: {
      provider,
      status,
      receivedAt: new Date().toISOString(),
      ...metadata,
    },
  };

  // Update payment
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      providerRef: providerRef || payment.providerRef,
      ...(newStatus === "PAID"
        ? { processedAt: new Date() }
        : {}),
      ...(newStatus === "FAILED"
        ? { failedAt: new Date(), failureReason: `Provider: ${provider}, Status: ${status}` }
        : {}),
      metadata: updatedMeta,
    },
  });

  // Update order payment status if paid
  if (newStatus === "PAID" && payment.orderId) {
    await db.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "PAID" },
    });

    // Add status history
    await db.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        status: "CONFIRMED",
        notes: `Paiement confirme via ${provider} (Ref: ${providerRef || "N/A"})`,
      },
    });
  }

  console.log(`[WEBHOOK] Payment ${payment.id} updated to ${newStatus} via ${provider}`);

  return { success: true, message: "Webhook traite avec succes" };
}

// ============================================
// Payment Status Check
// ============================================

/**
 * Check payment status (polling for frontend).
 */
export async function checkPaymentStatus(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
        },
      },
    },
  });

  if (!payment) {
    return { success: false, error: "Paiement introuvable" };
  }

  // If payment is PROCESSING and CinetPay is configured, check with provider
  if (payment.status === "PROCESSING" && cinetPayService.isConfigured() && payment.transactionId) {
    try {
      const cpStatus = await cinetPayService.checkPaymentStatus(payment.transactionId);
      if (cpStatus.status === "PAID") {
        // Update local record
        await db.payment.update({
          where: { id: paymentId },
          data: { status: "PAID", processedAt: new Date() },
        });
        await db.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: "PAID" },
        });
      }
    } catch (err) {
      console.error("[CINETPAY] Status check failed:", err);
    }
  }

  return {
    success: true,
    data: {
      id: payment.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      provider: payment.provider,
      status: payment.status,
      processedAt: payment.processedAt,
      failedAt: payment.failedAt,
      failureReason: payment.failureReason,
      paymentUrl: (payment.metadata as Record<string, unknown>)?.paymentUrl || null,
      order: payment.order,
    },
  };
}

// ============================================
// Helpers
// ============================================

function getProviderName(provider?: string | null): string {
  const names: Record<string, string> = {
    orange_money: "Orange Money",
    wave: "Wave",
    free_money: "Free Money",
    mtn_momo: "MTN MoMo",
    cinetpay: "CinetPay",
  };
  return names[provider || ""] || "Mobile Money";
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-GN").format(Math.round(amount)) + " FG";
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Especes",
    mobile_money: "Mobile Money",
    card: "Carte bancaire",
  };
  return labels[method] || method;
}

/** Map our mobile money provider to CinetPay channel name */
function mapProviderToCinetPayChannel(provider?: MobileMoneyProvider | null): string {
  const map: Record<string, string> = {
    orange_money: "ORANGE_MONEY",
    wave: "WAVE",
    free_money: "FREE_MONEY",
    mtn_momo: "MTN_MOMO",
  };
  return map[provider || ""] || "MOBILE_MONEY";
}
