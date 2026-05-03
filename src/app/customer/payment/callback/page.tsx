"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CallbackStatus = "loading" | "paid" | "failed" | "timeout";

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackFallback />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}

function PaymentCallbackFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-kfm-secondary/10">
        <Loader2 className="h-8 w-8 text-kfm-secondary animate-spin" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-text">Verification du paiement...</h2>
      <p className="mt-2 text-sm text-text-2">Chargement en cours...</p>
    </div>
  );
}

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentId = searchParams.get("transaction_id") || searchParams.get("paymentId") || searchParams.get("id");
  const hasPaymentId = !!paymentId;

  const [status, setStatus] = useState<CallbackStatus>(hasPaymentId ? "loading" : "timeout");
  const [message, setMessage] = useState(
    hasPaymentId
      ? ""
      : "Identifiant de paiement manquant. Verifiez vos commandes pour le statut."
  );
  const [attemptCount, setAttemptCount] = useState(0);

  const redirectTo = useCallback(
    (path: string, toast: string) => {
      sessionStorage.setItem("payment-toast", JSON.stringify({ message: toast }));
      router.push(path);
    },
    [router]
  );

  // Handle missing paymentId redirect
  useEffect(() => {
    if (!hasPaymentId) {
      const timer = setTimeout(
        () => redirectTo("/customer/orders", "Verifiez le statut de votre paiement dans vos commandes."),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [hasPaymentId, redirectTo]);

  // Poll payment status when we have a paymentId
  const pollDeps = useMemo(() => ({ paymentId, redirectTo }), [paymentId, redirectTo]);

  useEffect(() => {
    if (!pollDeps.paymentId || status !== "loading") return;

    let intervalId: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;
    const TIMEOUT_MS = 30 * 1000; // 30 seconds
    const POLL_INTERVAL_MS = 2000; // 2 seconds

    const pollStatus = async () => {
      try {
        setAttemptCount((prev) => prev + 1);
        const res = await fetch(`/api/payments/status?id=${pollDeps.paymentId}`);
        const data = await res.json();

        if (data.success && data.data) {
          const paymentStatus = data.data.status;

          if (paymentStatus === "PAID") {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            setStatus("paid");
            setMessage("Votre paiement a ete confirme avec succes !");
            setTimeout(() => {
              pollDeps.redirectTo("/customer/orders", "Paiement confirme avec succes !");
            }, 2500);
          } else if (paymentStatus === "FAILED") {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            setStatus("failed");
            setMessage("Le paiement a echoue. Veuillez reessayer.");
            setTimeout(() => {
              pollDeps.redirectTo("/customer/checkout", "Le paiement a echoue. Veuillez reessayer.");
            }, 3000);
          }
        }
      } catch {
        // Silently retry
      }
    };

    // Start polling
    pollStatus();
    intervalId = setInterval(pollStatus, POLL_INTERVAL_MS);

    // Timeout after 30 seconds
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setStatus("timeout");
      setMessage("Delai de verification depasse. Verifiez le statut dans vos commandes.");
      setTimeout(() => {
        pollDeps.redirectTo("/customer/orders", "Verifiez le statut de votre paiement dans vos commandes.");
      }, 3000);
    }, TIMEOUT_MS);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [pollDeps, status]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-full max-w-sm space-y-4">
        {/* Loading */}
        {status === "loading" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-kfm-secondary/10">
              <Loader2 className="h-8 w-8 text-kfm-secondary animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-text">Verification du paiement...</h2>
            <p className="text-sm text-text-2">
              Nous verifions le statut de votre paiement. Veuillez patienter.
            </p>
            <Card className="border-kfm-border bg-surface">
              <CardContent className="p-3">
                <p className="text-xs text-text-3">
                  Tentative {attemptCount} — Verification automatique toutes les 2 secondes
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Paid */}
        {status === "paid" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-kfm-success/10">
              <CheckCircle2 className="h-8 w-8 text-kfm-success" />
            </div>
            <h2 className="text-lg font-bold text-text">Paiement confirme !</h2>
            <p className="text-sm text-kfm-success">{message}</p>
            <p className="text-xs text-text-3">Redirection en cours...</p>
          </>
        )}

        {/* Failed */}
        {status === "failed" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-kfm-danger/10">
              <XCircle className="h-8 w-8 text-kfm-danger" />
            </div>
            <h2 className="text-lg font-bold text-text">Paiement echoue</h2>
            <p className="text-sm text-kfm-danger">{message}</p>
            <p className="text-xs text-text-3">Redirection en cours...</p>
          </>
        )}

        {/* Timeout */}
        {status === "timeout" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-kfm-warning/10">
              <Clock className="h-8 w-8 text-kfm-warning" />
            </div>
            <h2 className="text-lg font-bold text-text">Verification en cours</h2>
            <p className="text-sm text-text-2">{message}</p>
            <p className="text-xs text-text-3">Redirection en cours...</p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/customer/orders")}
                className="text-sm"
              >
                Voir mes commandes
              </Button>
              <Button
                className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white text-sm"
                onClick={() => router.push("/customer/menu")}
              >
                Retour au menu
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
