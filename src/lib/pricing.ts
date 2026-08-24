import type { ShippingSettingsData } from "@/lib/shipping-settings";
import { DEFAULT_SHIPPING_SETTINGS } from "@/lib/shipping-settings";
import { getShippingSettings } from "@/lib/shipping-settings";

import type { ShippingAddress } from "@/lib/orders";

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
  taxAmount: number;
  taxRate: number;
  taxLabel: string;
  total: number;
  countryCode: string;
};

/** Common checkout countries (ISO 3166-1 alpha-2) */
export const COUNTRY_OPTIONS: { code: string; en: string; zh: string }[] = [
  { code: "US", en: "United States", zh: "美国" },
  { code: "CA", en: "Canada", zh: "加拿大" },
  { code: "GB", en: "United Kingdom", zh: "英国" },
  { code: "DE", en: "Germany", zh: "德国" },
  { code: "FR", en: "France", zh: "法国" },
  { code: "IT", en: "Italy", zh: "意大利" },
  { code: "ES", en: "Spain", zh: "西班牙" },
  { code: "NL", en: "Netherlands", zh: "荷兰" },
  { code: "BE", en: "Belgium", zh: "比利时" },
  { code: "AT", en: "Austria", zh: "奥地利" },
  { code: "IE", en: "Ireland", zh: "爱尔兰" },
  { code: "SE", en: "Sweden", zh: "瑞典" },
  { code: "NO", en: "Norway", zh: "挪威" },
  { code: "DK", en: "Denmark", zh: "丹麦" },
  { code: "FI", en: "Finland", zh: "芬兰" },
  { code: "CH", en: "Switzerland", zh: "瑞士" },
  { code: "AU", en: "Australia", zh: "澳大利亚" },
  { code: "NZ", en: "New Zealand", zh: "新西兰" },
  { code: "JP", en: "Japan", zh: "日本" },
  { code: "KR", en: "South Korea", zh: "韩国" },
  { code: "SG", en: "Singapore", zh: "新加坡" },
  { code: "HK", en: "Hong Kong", zh: "中国香港" },
  { code: "TW", en: "Taiwan", zh: "中国台湾" },
  { code: "CN", en: "China", zh: "中国" },
  { code: "MX", en: "Mexico", zh: "墨西哥" },
  { code: "BR", en: "Brazil", zh: "巴西" },
  { code: "IN", en: "India", zh: "印度" },
  { code: "AE", en: "United Arab Emirates", zh: "阿联酋" },
  { code: "OTHER", en: "Other", zh: "其他" },
];

const EU_COUNTRIES = new Set([
  "DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "SE", "FI", "DK", "PL", "PT",
  "GR", "CZ", "RO", "HU", "SK", "BG", "HR", "SI", "LT", "LV", "EE", "LU", "MT", "CY",
]);

export function isEuCountry(countryCode: string) {
  return EU_COUNTRIES.has(countryCode);
}

const COUNTRY_ALIASES: Record<string, string> = {
  us: "US", usa: "US", "united states": "US", america: "US", 美国: "US",
  ca: "CA", canada: "CA", 加拿大: "CA",
  gb: "GB", uk: "GB", "united kingdom": "GB", britain: "GB", england: "GB", 英国: "GB",
  de: "DE", germany: "DE", deutschland: "DE", 德国: "DE",
  fr: "FR", france: "FR", 法国: "FR",
  it: "IT", italy: "IT", 意大利: "IT",
  es: "ES", spain: "ES", 西班牙: "ES",
  nl: "NL", netherlands: "NL", holland: "NL", 荷兰: "NL",
  au: "AU", australia: "AU", 澳大利亚: "AU",
  jp: "JP", japan: "JP", 日本: "JP",
  kr: "KR", korea: "KR", "south korea": "KR", 韩国: "KR",
  sg: "SG", singapore: "SG", 新加坡: "SG",
  hk: "HK", "hong kong": "HK", 香港: "HK",
  tw: "TW", taiwan: "TW", 台湾: "TW",
  cn: "CN", china: "CN", 中国: "CN",
  ch: "CH", switzerland: "CH", 瑞士: "CH",
  mx: "MX", mexico: "MX", 墨西哥: "MX",
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

const SHIPPING_RATES: Record<string, number> = {
  US: 5.99,
  CA: 8.99,
  GB: 9.99,
  AU: 14.99,
  JP: 12.99,
  SG: 11.99,
  HK: 9.99,
  CN: 12.99,
  TW: 11.99,
  KR: 12.99,
};

/** Default per-country shipping rates (used when DB has no override). */
export const DEFAULT_COUNTRY_SHIPPING_RATES: Record<string, number> = {
  ...SHIPPING_RATES,
};

function envNumber(key: string, fallback: number) {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeCountryCode(country: string): string {
  const trimmed = country.trim();
  if (!trimmed) return "OTHER";
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const alias = COUNTRY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  const match = COUNTRY_OPTIONS.find(
    (c) =>
      c.en.toLowerCase() === trimmed.toLowerCase() ||
      c.zh === trimmed ||
      c.code === trimmed.toUpperCase(),
  );
  return match?.code ?? "OTHER";
}

export function getCountryLabel(country: string, locale: "en" | "zh" = "en") {
  const code = normalizeCountryCode(country);
  const match = COUNTRY_OPTIONS.find((c) => c.code === code);
  if (!match) return country;
  return locale === "zh" ? match.zh : match.en;
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

  if (EU_COUNTRIES.has(countryCode) && !TAX_RATES[countryCode]) {
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
): Promise<OrderQuote> {
  const shippingSettings = settings ?? (await getShippingSettings());
  const subtotal = calcSubtotal(items);
  const discount = roundMoney(Math.min(discountAmount, subtotal));
  const discountedSubtotal = roundMoney(subtotal - discount);
  const countryCode = normalizeCountryCode(shippingAddress.country);
  const shippingFee = roundMoney(
    calcShippingFee(countryCode, discountedSubtotal, shippingSettings),
  );
  const { rate, label } = getTaxInfo(countryCode);
  const taxBase = roundMoney(discountedSubtotal + shippingFee);
  const taxAmount = roundMoney(taxBase * rate);
  const total = roundMoney(taxBase + taxAmount);

  return {
    subtotal,
    discountAmount: discount,
    couponCode,
    shippingFee,
    shippingFree: shippingFee === 0 && discountedSubtotal > 0,
    taxAmount,
    taxRate: rate,
    taxLabel: label,
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
