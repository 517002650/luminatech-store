import type { ShippingSettingsData } from "@/lib/shipping-settings";
import { DEFAULT_SHIPPING_SETTINGS, getShippingSettings } from "@/lib/shipping-settings";
import {
  isEuCountry,
  normalizeCountryCode,
} from "@/lib/countries";
import type { ShippingAddress } from "@/lib/orders";
import { isStripeTaxEnabled } from "@/lib/stripe-tax";

export {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY_SHIPPING_RATES,
  getCountryLabel,
  normalizeCountryCode,
  isEuCountry,
} from "@/lib/countries";

export type CartLine = {
  price: number;
  quantity: number;
};

export type OrderQuote = {
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  shippingFee: number;
  shippingFree: boolean;
  requiresFreightQuote: boolean;
  /** Entire cart is instant digital delivery (no physical shipping). */
  digitalDelivery: boolean;
  taxAmount: number;
  taxRate: number;
  taxLabel: string;
  /** When true, tax is computed by Stripe Tax at payment (estimate may be 0). */
  taxAtCheckout: boolean;
  total: number;
  countryCode: string;
};

const TAX_RATES: Record<string, { rate: number; label: string }> = {
  US: { rate: 0.08, label: "Sales Tax" },
  CA: { rate: 0.13, label: "Tax (HST)" },
  GB: { rate: 0.2, label: "VAT" },
  DE: { rate: 0.19, label: "VAT (MwSt)" },
  FR: { rate: 0.2, label: "VAT (TVA)" },
  IT: { rate: 0.22, label: "VAT (IVA)" },
  ES: { rate: 0.21, label: "VAT (IVA)" },
  NL: { rate: 0.21, label: "VAT (BTW)" },
  AU: { rate: 0.1, label: "GST" },
  NZ: { rate: 0.15, label: "GST" },
  JP: { rate: 0.1, label: "Consumption Tax" },
  CH: { rate: 0.077, label: "VAT" },
};

function envNumber(key: string, fallback: number) {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function calcShippingFee(
  countryCode: string,
  discountedSubtotal: number,
  settings: ShippingSettingsData = DEFAULT_SHIPPING_SETTINGS,
): number {
  if (discountedSubtotal >= settings.freeShippingThreshold) return 0;
  if (countryCode === "OTHER") return settings.flatRate;

  if (isEuCountry(countryCode)) {
    return settings.countryRates[countryCode] ?? settings.euRate;
  }

  return settings.countryRates[countryCode] ?? settings.flatRate;
}

function getTaxInfo(countryCode: string) {
  const envKey = `TAX_${countryCode}`;
  const envRate = process.env[envKey]?.trim();
  if (envRate) {
    const rate = Number(envRate);
    if (Number.isFinite(rate)) {
      return { rate, label: rate >= 0.15 ? "VAT" : "Tax" };
    }
  }

  if (isEuCountry(countryCode) && !TAX_RATES[countryCode]) {
    return { rate: envNumber("TAX_EU_DEFAULT", 0.21), label: "VAT" };
  }

  return TAX_RATES[countryCode] ?? { rate: envNumber("DEFAULT_TAX_RATE", 0), label: "Tax" };
}

export function calcSubtotal(items: CartLine[]) {
  return roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function buildOrderQuote(
  items: CartLine[],
  shippingAddress: Pick<ShippingAddress, "country">,
  discountAmount: number,
  couponCode: string | null,
  settings?: ShippingSettingsData,
  options?: { requiresFreightQuote?: boolean; digitalDelivery?: boolean },
): Promise<OrderQuote> {
  const shippingSettings = settings ?? (await getShippingSettings());
  const subtotal = calcSubtotal(items);
  const discount = roundMoney(Math.min(discountAmount, subtotal));
  const discountedSubtotal = roundMoney(subtotal - discount);
  const countryCode = normalizeCountryCode(shippingAddress.country);
  const requiresFreightQuote = Boolean(options?.requiresFreightQuote);
  const digitalDelivery = Boolean(options?.digitalDelivery);

  const shippingFee =
    requiresFreightQuote || digitalDelivery
      ? 0
      : roundMoney(calcShippingFee(countryCode, discountedSubtotal, shippingSettings));

  const taxAtCheckout = isStripeTaxEnabled();
  let taxAmount = 0;
  let taxRate = 0;
  let taxLabel = "Tax";

  if (taxAtCheckout) {
    taxLabel = "Tax (at checkout)";
    taxRate = 0;
    taxAmount = 0;
  } else {
    const info = getTaxInfo(countryCode);
    taxRate = info.rate;
    taxLabel = info.label;
    const taxBase = roundMoney(discountedSubtotal + shippingFee);
    taxAmount = roundMoney(taxBase * taxRate);
  }

  const taxBase = roundMoney(discountedSubtotal + shippingFee);
  const total = roundMoney(taxBase + taxAmount);

  return {
    subtotal,
    discountAmount: discount,
    couponCode,
    shippingFee,
    shippingFree:
      digitalDelivery ||
      (!requiresFreightQuote && shippingFee === 0 && discountedSubtotal > 0),
    requiresFreightQuote,
    digitalDelivery,
    taxAmount,
    taxRate,
    taxLabel,
    taxAtCheckout,
    total,
    countryCode,
  };
}

export type PricingMetadata = {
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  couponCode: string;
};

export function quoteToMetadata(quote: OrderQuote): PricingMetadata {
  return {
    subtotal: quote.subtotal,
    shippingFee: quote.shippingFee,
    taxAmount: quote.taxAmount,
    discountAmount: quote.discountAmount,
    couponCode: quote.couponCode ?? "",
  };
}

export function parsePricingMetadata(
  raw: Record<string, string | undefined> | null | undefined,
): PricingMetadata | null {
  if (!raw?.subtotal) return null;
  return {
    subtotal: Number(raw.subtotal) || 0,
    shippingFee: Number(raw.shippingFee) || 0,
    taxAmount: Number(raw.taxAmount) || 0,
    discountAmount: Number(raw.discountAmount) || 0,
    couponCode: raw.couponCode ?? "",
  };
}
