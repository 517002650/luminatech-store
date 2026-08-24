"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ShippingAddress } from "@/lib/orders";
import { COUPON_STORAGE_KEY, SHIPPING_STORAGE_KEY } from "@/lib/orders";
import { COUNTRY_OPTIONS } from "@/lib/pricing";
import type { Locale } from "@/i18n/routing";

type Props = {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
  errors?: Partial<Record<keyof ShippingAddress | "form", string>>;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500";

export function ShippingAddressForm({ value, onChange, errors }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;

  function update<K extends keyof ShippingAddress>(key: K, fieldValue: ShippingAddress[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">{t("shippingTitle")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-stone-700">{t("email")}</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={value.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
          {errors?.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-stone-700">{t("fullName")}</label>
          <input
            type="text"
            required
            autoComplete="name"
            value={value.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
          {errors?.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-stone-700">{t("phone")}</label>
          <input
            type="tel"
            autoComplete="tel"
            value={value.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-stone-700">{t("addressLine1")}</label>
          <input
            type="text"
            required
            autoComplete="address-line1"
            value={value.line1}
            onChange={(e) => update("line1", e.target.value)}
            className={inputClass}
          />
          {errors?.line1 && <p className="mt-1 text-xs text-red-600">{errors.line1}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-stone-700">{t("addressLine2")}</label>
          <input
            type="text"
            autoComplete="address-line2"
            value={value.line2 ?? ""}
            onChange={(e) => update("line2", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-stone-700">{t("city")}</label>
          <input
            type="text"
            required
            autoComplete="address-level2"
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            className={inputClass}
          />
          {errors?.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-stone-700">{t("state")}</label>
          <input
            type="text"
            autoComplete="address-level1"
            value={value.state}
            onChange={(e) => update("state", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-stone-700">{t("country")}</label>
          <select
            required
            autoComplete="country-name"
            value={value.country}
            onChange={(e) => update("country", e.target.value)}
            className={inputClass}
          >
            <option value="">{t("countryPlaceholder")}</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {locale === "zh" ? c.zh : c.en}
              </option>
            ))}
          </select>
          {errors?.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-stone-700">{t("postalCode")}</label>
          <input
            type="text"
            required
            autoComplete="postal-code"
            value={value.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            className={inputClass}
          />
          {errors?.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
        </div>
      </div>
    </div>
  );
}

export function emptyShippingAddress(email = "", name = ""): ShippingAddress {
  return {
    email,
    name,
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  };
}

export function saveShippingToSession(address: ShippingAddress) {
  sessionStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(address));
}

export function loadShippingFromSession(): ShippingAddress | null {
  try {
    const raw = sessionStorage.getItem(SHIPPING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShippingAddress;
  } catch {
    return null;
  }
}

export function clearShippingSession() {
  sessionStorage.removeItem(SHIPPING_STORAGE_KEY);
}

export function saveCouponToSession(code: string) {
  sessionStorage.setItem(COUPON_STORAGE_KEY, code);
}

export function loadCouponFromSession(): string {
  return sessionStorage.getItem(COUPON_STORAGE_KEY) ?? "";
}

export function clearCouponSession() {
  sessionStorage.removeItem(COUPON_STORAGE_KEY);
}
