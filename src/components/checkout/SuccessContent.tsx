"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const completedRef = useRef(false);
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;

    async function completeOrder() {
      const shippingAddress = loadShippingFromSession();
      let purchase: Ga4PurchasePayload | undefined;

      try {
        if (provider === "stripe" && sessionId) {
          const res = await fetch("/api/orders/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider,
              sessionId,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { purchase?: Ga4PurchasePayload };
            purchase = data.purchase;
          }
        } else if (provider === "paypal") {
          if (items.length === 0) return;
          const couponCode = loadCouponFromSession();
          const res = await fetch("/api/orders/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider,
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
          if (res.ok) {
            const data = (await res.json()) as { purchase?: Ga4PurchasePayload };
            purchase = data.purchase;
          }
        }

        if (purchase && !purchaseTrackedRef.current) {
          purchaseTrackedRef.current = true;
          // GA script may load slightly after success page paints.
          window.setTimeout(() => trackGa4Purchase(purchase!), 400);
        }
      } catch {
        // Payment succeeded; order recording failure shouldn't block the user.
      } finally {
        completedRef.current = true;
        clearShippingSession();
        clearCouponSession();
        clearCart();
        setProcessing(false);
      }
    }

    completeOrder();
  }, [provider, sessionId, paypalOrderId, items, clearCart]);

  const providerName =
    provider === "paypal" ? t("providerPaypal") : t("providerStripe");

  if (processing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <p className="text-zinc-400">{t("processing")}</p>
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
