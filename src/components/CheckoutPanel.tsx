"use client";

import { useEffect, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
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
import {
  savedToShipping,
  type SavedAddress,
} from "@/lib/user-addresses";
import { lightCardClass, lightCardMutedClass, lightInputInlineClass } from "@/lib/form-styles";
import { AFFILIATE_COOKIE } from "@/lib/affiliates";

type Props = {
  initialEmail?: string;
  initialName?: string;
  savedAddresses?: SavedAddress[];
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

export function CheckoutPanel({
  initialEmail = "",
  initialName = "",
  savedAddresses = [],
}: Props) {
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
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    const d = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    return d?.id ?? "";
  });
  const [shipping, setShipping] = useState<ShippingAddress>(() => {
    const d = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    return d
      ? savedToShipping(d)
      : emptyShippingAddress(initialEmail, initialName);
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function applySavedAddress(id: string) {
    setSelectedAddressId(id);
    const addr = savedAddresses.find((a) => a.id === id);
    if (addr) {
      setShipping(savedToShipping(addr));
      setFieldErrors({});
    }
  }

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
              variantId: i.variantId,
              variantSku: i.variantSku,
              slug: i.slug,
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
          setError(t("errors.stock"));
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
      variantId: item.variantId,
      variantSku: item.variantSku,
      slug: item.slug,
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
          affiliateCode: readAffiliateCookie() || undefined,
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
      {savedAddresses.length > 0 ? (
        <div className={lightCardClass}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("savedAddresses")}</h2>
            <Link
              href="/account/addresses"
              className="text-sm text-amber-700 hover:underline"
            >
              {t("manageAddresses")}
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {savedAddresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-3 text-sm ${
                  selectedAddressId === addr.id
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <input
                  type="radio"
                  name="savedAddress"
                  className="mt-1"
                  checked={selectedAddressId === addr.id}
                  onChange={() => applySavedAddress(addr.id)}
                />
                <span>
                  <span className="font-medium text-stone-900">
                    {addr.label}
                    {addr.isDefault ? ` · ${t("defaultAddress")}` : ""}
                  </span>
                  <span className="mt-0.5 block text-stone-600">
                    {addr.name} · {addr.line1}, {addr.city}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <ShippingAddressForm
        value={shipping}
        onChange={(next) => {
          setSelectedAddressId("");
          setShipping(next);
        }}
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
                ? quote.requiresFreightQuote
                  ? t("shippingFreight")
                  : quote.shippingFree
                    ? t("shippingFree")
                    : formatPrice(quote.shippingFee)
                : t("shippingPending")}
            </span>
          </div>
          {quote && quote.taxAtCheckout ? (
            <div className="flex justify-between">
              <span className="text-stone-600">{t("taxAtCheckout")}</span>
              <span className="font-medium text-stone-500">{t("taxAtCheckoutValue")}</span>
            </div>
          ) : quote && quote.taxAmount > 0 ? (
            <div className="flex justify-between">
              <span className="text-stone-600">
                {quote.taxLabel} ({Math.round(quote.taxRate * 100)}%)
              </span>
              <span className="font-medium">{formatPrice(quote.taxAmount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
            <span>{t("total")}</span>
            <span>{formatPrice(displayTotal)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          {quote?.requiresFreightQuote
            ? t("freightNote")
            : t("shippingNote", { amount: freeShippingThreshold })}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {quote?.requiresFreightQuote ? (
        <div className="space-y-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-5">
          <h2 className="text-lg font-semibold text-amber-100">{t("freightTitle")}</h2>
          <p className="text-sm text-amber-100/80">{t("freightBody")}</p>
          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
          >
            {t("freightCta")}
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
