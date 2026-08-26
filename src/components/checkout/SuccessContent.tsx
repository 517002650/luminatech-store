"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCartStore } from "@/store/cart";
import {
  clearShippingSession,
  loadShippingFromSession,
  loadCouponFromSession,
  clearCouponSession,
} from "@/components/ShippingAddressForm";
import {
  trackGa4Purchase,
  type Ga4PurchasePayload,
} from "@/lib/analytics";
import { AFFILIATE_COOKIE } from "@/lib/affiliates";

type Props = {
  isLoggedIn: boolean;
};

function readAffiliateCookie() {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AFFILIATE_COOKIE}=`));
  if (!match) return "";
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

export function SuccessContent({ isLoggedIn }: Props) {
  const t = useTranslations("success");
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") ?? "stripe";
  const sessionId = searchParams.get("session_id");
  const paypalOrderId = searchParams.get("order_id");
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [processing, setProcessing] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const completedRef = useRef(false);
  const purchaseTrackedRef = useRef(false);

  const finalizeSuccess = useCallback(() => {
    clearShippingSession();
    clearCouponSession();
    clearCart();
  }, [clearCart]);

  const completeStripeOrder = useCallback(async () => {
    if (!sessionId) {
      setOrderError(t("missingSession"));
      return;
    }

    const res = await fetch("/api/orders/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "stripe",
        sessionId,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      orderId?: string;
      purchase?: Ga4PurchasePayload;
    };

    if (!res.ok) {
      setOrderError(data.error ?? t("orderFailed"));
      return;
    }

    setOrderId(data.orderId ?? null);
    if (data.purchase && !purchaseTrackedRef.current) {
      purchaseTrackedRef.current = true;
      window.setTimeout(() => trackGa4Purchase(data.purchase!), 400);
    }
    finalizeSuccess();
  }, [sessionId, t, finalizeSuccess]);

  const completePaypalOrder = useCallback(async () => {
    if (items.length === 0) {
      setOrderError(t("emptyCart"));
      return;
    }

    const shippingAddress = loadShippingFromSession();
    const couponCode = loadCouponFromSession();
    const res = await fetch("/api/orders/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "paypal",
        paypalOrderId: paypalOrderId ?? undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: shippingAddress ?? undefined,
        couponCode: couponCode || undefined,
        affiliateCode: readAffiliateCookie() || undefined,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      orderId?: string;
      purchase?: Ga4PurchasePayload;
    };

    if (!res.ok) {
      setOrderError(data.error ?? t("orderFailed"));
      return;
    }

    setOrderId(data.orderId ?? null);
    if (data.purchase && !purchaseTrackedRef.current) {
      purchaseTrackedRef.current = true;
      window.setTimeout(() => trackGa4Purchase(data.purchase!), 400);
    }
    finalizeSuccess();
  }, [items, paypalOrderId, t, finalizeSuccess]);

  const runComplete = useCallback(async () => {
    setProcessing(true);
    setOrderError(null);

    try {
      if (provider === "stripe") {
        await completeStripeOrder();
      } else if (provider === "paypal") {
        await completePaypalOrder();
      }
    } catch {
      setOrderError(t("orderFailed"));
    } finally {
      setProcessing(false);
    }
  }, [provider, completeStripeOrder, completePaypalOrder, t]);

  useEffect(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    void runComplete();
  }, [runComplete]);

  const providerName =
    provider === "paypal" ? t("providerPaypal") : t("providerStripe");

  if (processing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <p className="text-zinc-400">{t("processing")}</p>
      </div>
    );
  }

  if (orderError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl font-bold text-amber-800">
          !
        </div>
        <h1 className="mt-6 text-2xl font-bold text-zinc-50">{t("paymentOkOrderPending")}</h1>
        <p className="mt-4 text-sm text-zinc-300">{t("paymentOkOrderPendingHint")}</p>
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {orderError}
        </p>
        {sessionId ? (
          <p className="mt-3 text-xs text-zinc-500">
            {t("sessionRef")}: <span className="font-mono">{sessionId}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              completedRef.current = false;
              void runComplete();
            }}
            className="inline-block rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-900 hover:bg-amber-400"
          >
            {t("retryConfirm")}
          </button>
          <Link
            href="/contact"
            className="inline-block rounded-xl border border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            {t("contactSupport")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-bold text-zinc-50">{t("title")}</h1>
      <p className="mt-4 text-zinc-300">
        {t("message", { provider: providerName })}
      </p>
      {orderId ? (
        <p className="mt-2 text-xs text-zinc-500">
          {t("orderRef")}: <span className="font-mono">{orderId}</span>
        </p>
      ) : null}
      <p className="mt-2 text-sm text-zinc-500">{t("emailNote")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {isLoggedIn && (
          <Link
            href="/account/orders"
            className="inline-block rounded-xl bg-amber-500 px-8 py-3 text-sm font-semibold text-stone-900 hover:bg-amber-400"
          >
            {t("viewOrders")}
          </Link>
        )}
        <Link
          href="/products"
          className="inline-block rounded-xl bg-stone-900 px-8 py-3 text-sm font-semibold text-white"
        >
          {t("continue")}
        </Link>
      </div>
    </div>
  );
}
