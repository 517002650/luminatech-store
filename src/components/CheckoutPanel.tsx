"use client";

import { useEffect, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { getCartItemName } from "@/lib/product-i18n";
import type { OrderQuote } from "@/lib/pricing";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/store/cart";
import {
  ShippingAddressForm,
  emptyShippingAddress,
  saveCouponToSession,
  saveShippingToSession,
} from "@/components/ShippingAddressForm";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { lightCardClass, lightCardMutedClass, lightInputInlineClass } from "@/lib/form-styles";

type Props = {
  initialEmail?: string;
  initialName?: string;
};

export function CheckoutPanel({ initialEmail = "", initialName = "" }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.totalPrice());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("100");
  const [shipping, setShipping] = useState<ShippingAddress>(() =>
    emptyShippingAddress(initialEmail, initialName),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const paypalEnabled =
    process.env.NEXT_PUBLIC_PAYPAL_ENABLED === "true" && Boolean(paypalClientId);

  useEffect(() => {
    let cancelled = false;

    async function fetchQuote() {
      if (!items.length) {
        setQuote(null);
        return;
      }

      const addressError = validateShippingAddress(shipping);
      if (addressError) {
        setQuote(null);
        setCouponError("");
        return;
      }

      try {
        const res = await fetch("/api/pricing/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
            shippingAddress: shipping,
            couponCode: appliedCoupon || undefined,
            locale,
          }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (data.stockError) {
          setCouponError("");
          setQuote(null);
          setError(data.error || t("errors.stock"));
          return;
        }

        if (data.couponError) {
          setCouponError(t(`couponErrors.${data.couponError as string}`));
          setQuote(null);
          return;
        }

        setError("");
        setCouponError("");
        setQuote(data.quote ?? null);
        if (data.freeShippingThreshold != null) {
          setFreeShippingThreshold(String(data.freeShippingThreshold));
        }
      } catch {
        if (!cancelled) setQuote(null);
      }
    }

    const timer = setTimeout(fetchQuote, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [items, shipping, appliedCoupon, t]);

  function validateForm() {
    const code = validateShippingAddress(shipping);
    if (code) {
      const errors: Record<string, string> = {};
      const map: Record<string, string> = {
        email_required: "email",
        email_invalid: "email",
        name_required: "name",
        line1_required: "line1",
        city_required: "city",
        country_required: "country",
        postal_required: "postalCode",
      };
      const key = map[code];
      if (key) errors[key] = t(`errors.${code}`);
      setFieldErrors(errors);
      setError(t("errors.form"));
      return false;
    }
    if (couponError || (appliedCoupon && !quote)) {
      setError(t("errors.coupon"));
      return false;
    }
    setFieldErrors({});
    setError("");
    return true;
  }

  function persistCheckoutSession() {
    saveShippingToSession(shipping);
    if (appliedCoupon) saveCouponToSession(appliedCoupon);
  }

  function applyCoupon() {
    setAppliedCoupon(couponInput.trim().toUpperCase());
  }

  function mapCartItems() {
    return items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
  }

  async function payWithStripe() {
    if (!validateForm() || !quote) return;

    setLoading(true);
    setError("");
    persistCheckoutSession();

    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          shippingAddress: shipping,
          couponCode: appliedCoupon || undefined,
          items: mapCartItems(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-zinc-400">{t("empty")}</p>;
  }

  const displayTotal = quote?.total ?? subtotal;

  return (
    <div className="space-y-6">
      <ShippingAddressForm
        value={shipping}
        onChange={setShipping}
        errors={fieldErrors}
      />

      <div className={lightCardClass}>
        <h2 className="text-lg font-semibold">{t("couponTitle")}</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder={t("couponPlaceholder")}
            className={`flex-1 ${lightInputInlineClass} uppercase`}
          />
          <button
            type="button"
            onClick={applyCoupon}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
          >
            {t("applyCoupon")}
          </button>
        </div>
        {appliedCoupon && !couponError && (
          <p className="mt-2 text-sm text-green-700">{t("couponApplied", { code: appliedCoupon })}</p>
        )}
        {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
      </div>

      <div className={lightCardMutedClass}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">{t("subtotal")}</span>
            <span className="font-medium">{formatPrice(quote?.subtotal ?? subtotal)}</span>
          </div>
          {quote && quote.discountAmount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>{t("discount")}</span>
              <span>-{formatPrice(quote.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone-600">{t("shipping")}</span>
            <span className="font-medium">
              {quote
                ? quote.shippingFree
                  ? t("shippingFree")
                  : formatPrice(quote.shippingFee)
                : t("shippingPending")}
            </span>
          </div>
          {quote && quote.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-600">
                {quote.taxLabel} ({Math.round(quote.taxRate * 100)}%)
              </span>
              <span className="font-medium">{formatPrice(quote.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
            <span>{t("total")}</span>
            <span>{formatPrice(displayTotal)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          {t("shippingNote", { amount: freeShippingThreshold })}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">{t("paymentTitle")}</h2>

        <button
          type="button"
          onClick={payWithStripe}
          disabled={loading || !quote}
          className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? t("redirecting") : t("payStripe")}
        </button>
        <p className="text-center text-xs text-zinc-500">{t("stripeMethodsHint")}</p>

        {paypalEnabled && quote ? (
          <PayPalScriptProvider
            options={{
              clientId: paypalClientId!,
              currency: "USD",
              intent: "capture",
              locale: locale === "zh" ? "zh_CN" : "en_US",
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical", color: "gold", shape: "rect" }}
              disabled={!quote}
              createOrder={(_, actions) => {
                if (!validateForm() || !quote) {
                  return Promise.reject(new Error("invalid_checkout"));
                }
                persistCheckoutSession();
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        currency_code: "USD",
                        value: quote.total.toFixed(2),
                        breakdown: {
                          item_total: {
                            currency_code: "USD",
                            value: quote.subtotal.toFixed(2),
                          },
                          shipping: {
                            currency_code: "USD",
                            value: quote.shippingFee.toFixed(2),
                          },
                          tax_total: {
                            currency_code: "USD",
                            value: quote.taxAmount.toFixed(2),
                          },
                          discount: {
                            currency_code: "USD",
                            value: quote.discountAmount.toFixed(2),
                          },
                        },
                      },
                      items: items.map((item) => ({
                        name: getCartItemName(item, "en").slice(0, 127),
                        unit_amount: {
                          currency_code: "USD",
                          value: Number(item.price).toFixed(2),
                        },
                        quantity: String(item.quantity),
                        category: "PHYSICAL_GOODS",
                      })),
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                await actions.order?.capture();
                router.push(
                  `/checkout/success?provider=paypal&order_id=${data.orderID}`,
                );
              }}
              onError={() => setError(t("paypalError"))}
            />
          </PayPalScriptProvider>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-500">
            {t("paypalHint")}
          </p>
        )}
      </div>
    </div>
  );
}
