// ============================================
// KFM Delice — CinetPay Integration Service
// Payment provider for West Africa:
// - Mobile Money (Orange Money, Wave, Free Money, MTN MoMo)
// - Card (Visa, Mastercard)
// ============================================
//
// Documentation: https://docs.cinetpay.com/
// API Base: https://api.cinetpay.com/v2
// ============================================

import crypto from "crypto";

// ============================================
// Types
// ============================================

interface CinetPayConfig {
  siteId: string;
  apiKey: string;
  secretKey: string;
  mode: "sandbox" | "production";
  notifyUrl: string;
  returnUrl: string;
  cancelUrl?: string;
}

interface CinetPayPaymentRequest {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notifyUrl: string;
  returnUrl: string;
  channels?: string;
}

interface CinetPayPaymentResponse {
  code: string;
  message: string;
  data?: {
    payment_token: string;
    payment_url: string;
    trans_id?: string;
  };
  api_version: string;
}

interface CinetPayStatusResponse {
  code: string;
  message: string;
  data?: {
    trans_id: string;
    trans_status: string;
    trans_amount: number;
    trans_currency: string;
    trans_date: string;
    cpm_trans_id: string;
    cpm_amount: string;
    cpm_currency: string;
    cpm_trans_status: string;
    cpm_trans_date: string;
    cpm_phone_prefixe: string;
    cpm_language: string;
    cpm_payment_date: string;
    signature: string;
    payment_method: string;
    payment_date: string;
    buyer_name: string;
  };
  api_version: string;
}

// ============================================
// Service Class
// ============================================

class CinetPayService {
  private config: CinetPayConfig | null = null;
  private baseUrl: string;

  constructor() {
    // Read config from environment variables
    const siteId = process.env.CINETPAY_SITE_ID;
    const apiKey = process.env.CINETPAY_API_KEY;
    const secretKey = process.env.CINETPAY_SECRET_KEY;

    if (siteId && apiKey && secretKey) {
      this.config = {
        siteId,
        apiKey,
        secretKey,
        mode: (process.env.CINETPAY_MODE as "sandbox" | "production") || "sandbox",
        notifyUrl: process.env.CINETPAY_NOTIFY_URL || "/api/payments/webhook",
        returnUrl: process.env.CINETPAY_RETURN_URL || "/customer/orders",
        cancelUrl: process.env.CINETPAY_CANCEL_URL || "/customer/menu",
      };
    }

    this.baseUrl =
      this.config?.mode === "production"
        ? "https://api.cinetpay.com/v2"
        : "https://api.cinetpay.com/v2/sandbox";
  }

  /** Check if CinetPay is properly configured */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /** Get current mode (sandbox/production) */
  getMode(): string {
    return this.config?.mode || "not-configured";
  }

  // ============================================
  // Create Payment Session
  // ============================================

  /**
   * Create a payment session on CinetPay.
   * Returns a payment URL for the customer to complete payment.
   */
  async createPayment(params: CinetPayPaymentRequest): Promise<{
    success: boolean;
    paymentUrl?: string | null;
    paymentToken?: string | null;
    error?: string;
  }> {
    if (!this.config) {
      return {
        success: false,
        error: "CinetPay non configure. Ajoutez CINETPAY_SITE_ID, CINETPAY_API_KEY et CINETPAY_SECRET_KEY dans .env",
      };
    }

    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: params.transactionId,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        notify_url: params.notifyUrl,
        return_url: params.returnUrl,
        channels: params.channels || "ALL",
        customer_name: params.customerName,
        customer_phone: params.customerPhone.replace(/\s/g, ""),
        customer_email: params.customerEmail,
        customer_city: "Conakry",
        customer_country: "GN",
        customer_state: "GN",
        customer_zip_code: "1000",
        lang: "fr",
      };

      const response = await fetch(`${this.baseUrl}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[CINETPAY] HTTP error:", response.status, text);
        return { success: false, error: `Erreur HTTP ${response.status}` };
      }

      const data: CinetPayPaymentResponse = await response.json();

      if (data.code === "201" && data.data) {
        return {
          success: true,
          paymentUrl: data.data.payment_url,
          paymentToken: data.data.payment_token,
        };
      } else {
        console.error("[CINETPAY] API error:", data);
        return {
          success: false,
          error: data.message || "Erreur lors de la creation du paiement CinetPay",
        };
      }
    } catch (err) {
      console.error("[CINETPAY] createPayment error:", err);
      return {
        success: false,
        error: "Erreur de connexion au service CinetPay",
      };
    }
  }

  // ============================================
  // Check Payment Status
  // ============================================

  /**
   * Check the status of a payment on CinetPay.
   */
  async checkPaymentStatus(transactionId: string): Promise<{
    status: string;
    amount?: number;
    providerRef?: string;
    error?: string;
  }> {
    if (!this.config) {
      return { status: "UNKNOWN", error: "CinetPay non configure" };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/payment/check?apikey=${this.config.apiKey}&site_id=${this.config.siteId}&transaction_id=${transactionId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return { status: "UNKNOWN", error: `Erreur HTTP ${response.status}` };
      }

      const data: CinetPayStatusResponse = await response.json();

      if (data.code === "201" && data.data) {
        const cpStatus = data.data.cpm_trans_status || data.data.trans_status;

        // Map CinetPay statuses to our statuses
        const statusMap: Record<string, string> = {
          ACCEPTED: "PAID",
          completed: "PAID",
          success: "PAID",
          PENDING: "PENDING",
          pending: "PENDING",
          REFUSED: "FAILED",
          cancelled: "FAILED",
          expired: "FAILED",
        };

        return {
          status: statusMap[cpStatus] || "PENDING",
          amount: data.data.trans_amount || parseFloat(data.data.cpm_amount) || 0,
          providerRef: data.data.cpm_trans_id,
        };
      } else {
        console.error("[CINETPAY] Status check error:", data);
        return { status: "UNKNOWN", error: data.message };
      }
    } catch (err) {
      console.error("[CINETPAY] checkPaymentStatus error:", err);
      return { status: "UNKNOWN", error: "Erreur de connexion" };
    }
  }

  // ============================================
  // Webhook Signature Verification
  // ============================================

  /**
   * Verify the HMAC signature from a CinetPay webhook callback.
   * This ensures the webhook is genuinely from CinetPay.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.config) {
      console.error("[CINETPAY] Cannot verify signature: not configured");
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.config.secretKey)
        .update(rawBody)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch (err) {
      console.error("[CINETPAY] Signature verification error:", err);
      return false;
    }
  }

  // ============================================
  // Parse Webhook Payload
  // ============================================

  /**
   * Parse and normalize a CinetPay webhook payload.
   */
  parseWebhookPayload(body: Record<string, unknown>): {
    transactionId: string;
    status: string;
    amount: number;
    currency: string;
    providerRef: string;
    paymentMethod: string;
    customerPhone: string;
  } | null {
    try {
      return {
        transactionId: (body.cpm_trans_id || body.transaction_id) as string,
        status: (body.cpm_trans_status || body.status || "PENDING") as string,
        amount: parseFloat((body.cpm_amount || body.amount || "0") as string),
        currency: (body.cpm_currency || body.currency || "GNF") as string,
        providerRef: (body.cpm_trans_id || body.transaction_id) as string,
        paymentMethod: (body.payment_method || body.channels || "unknown") as string,
        customerPhone: (body.cpm_phone_prefixe || body.customer_phone || "") as string,
      };
    } catch (err) {
      console.error("[CINETPAY] Failed to parse webhook payload:", err);
      return null;
    }
  }
}

// ============================================
// Singleton Export
// ============================================

export const cinetPayService = new CinetPayService();
