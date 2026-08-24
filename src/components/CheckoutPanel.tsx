"use client";

import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { getCartItemName } from "@/lib/product-i18n";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/store/cart";
import {
  ShippingAddressForm,
  emptyShippingAddress,
  saveShippingToSession,
} from "@/components/ShippingAddressForm";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";

type Props = {
  initialEmail?: string;
  initialName?: string;
};

export function CheckoutPanel({ initialEmail = "", initialName = "" }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState<ShippingAddress>(() =>
    emptyShippingAddress(initialEmail, initialName),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

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
    setFieldErrors({});
    setError("");
    return true;
  }

  function persistShipping() {
    saveShippingToSession(shipping);
  }

  async function payWithStripe() {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    persistShipping();

    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          shippingAddress: shipping,
          items: items.map((item) => ({
            productId: item.productId,
            slug: item.slug,
            nameEn: item.nameEn,
            nameZh: item.nameZh,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            name: getCartItemName(item, "en"),
          })),
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
    return <p className="text-stone-500">{t("empty")}</p>;
  }

  return (
    <div className="space-y-6">
      <ShippingAddressForm
        value={shipping}
        onChange={setShipping}
        errors={fieldErrors}
      />

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <div className="flex justify-between text-lg font-bold">
          <span>{t("total")}</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <p className="mt-2 text-sm text-stone-500">{t("shippingNote")}</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">{t("paymentTitle")}</h2>

        <button
          type="button"
          onClick={payWithStripe}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? t("redirecting") : t("payStripe")}
        </button>

        {paypalClientId ? (
          <PayPalScriptProvider
            options={{
              clientId: paypalClientId,
              currency: "USD",
              intent: "capture",
              locale: locale === "zh" ? "zh_CN" : "en_US",
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical", color: "gold", shape: "rect" }}
              createOrder={(_, actions) => {
                if (!validateForm()) {
                  return Promise.reject(new Error("invalid_shipping"));
                }
                persistShipping();
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        currency_code: "USD",
                        value: totalPrice.toFixed(2),
                        breakdown: {
                          item_total: {
                            currency_code: "USD",
                            value: totalPrice.toFixed(2),
                          },
                        },
                      },
                      items: items.map((item) => ({
                        name: getCartItemName(item, "en"),
                        unit_amount: {
                          currency_code: "USD",
                          value: item.price.toFixed(2),
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
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500">
            {t("paypalHint")}
          </p>
        )}
      </div>
    </div>
  );
}
