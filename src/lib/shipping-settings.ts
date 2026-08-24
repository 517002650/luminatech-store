import { prisma } from "@/lib/db";
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_SHIPPING_RATES } from "@/lib/countries";

export type ShippingSettingsData = {
  freeShippingThreshold: number;
  flatRate: number;
  euRate: number;
  countryRates: Record<string, number>;
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettingsData = {
  freeShippingThreshold: 100,
  flatRate: 15.99,
  euRate: 12.99,
  countryRates: { ...DEFAULT_COUNTRY_SHIPPING_RATES },
};

function parseCountryRates(raw: string): Record<string, number> {
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (!parsed || typeof parsed !== "object") return {};
    const result: Record<string, number> = {};
    for (const [code, rate] of Object.entries(parsed)) {
      const n = Number(rate);
      if (Number.isFinite(n) && n >= 0) {
        result[code.toUpperCase()] = n;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function rowToSettings(row: {
  freeShippingThreshold: number;
  flatRate: number;
  euRate: number;
  countryRates: string;
}): ShippingSettingsData {
  return {
    freeShippingThreshold: row.freeShippingThreshold,
    flatRate: row.flatRate,
    euRate: row.euRate,
    countryRates: parseCountryRates(row.countryRates),
  };
}

export async function ensureShippingSettings() {
  const existing = await prisma.shippingSettings.findUnique({
    where: { id: "default" },
  });
  if (existing) return;

  await prisma.shippingSettings.create({
    data: {
      id: "default",
      freeShippingThreshold: DEFAULT_SHIPPING_SETTINGS.freeShippingThreshold,
      flatRate: DEFAULT_SHIPPING_SETTINGS.flatRate,
      euRate: DEFAULT_SHIPPING_SETTINGS.euRate,
      countryRates: JSON.stringify(DEFAULT_SHIPPING_SETTINGS.countryRates),
    },
  });
}

export async function getShippingSettings(): Promise<ShippingSettingsData> {
  await ensureShippingSettings();
  const row = await prisma.shippingSettings.findUnique({
    where: { id: "default" },
  });
  if (!row) return DEFAULT_SHIPPING_SETTINGS;
  return rowToSettings(row);
}

export function buildCountryRatesFromForm(formData: FormData): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const country of COUNTRY_OPTIONS) {
    if (country.code === "OTHER") continue;
    const raw = String(formData.get(`rate_${country.code}`) ?? "").trim();
    if (!raw) continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) {
      rates[country.code] = n;
    }
  }
  return rates;
}

export async function updateShippingSettings(data: ShippingSettingsData) {
  await ensureShippingSettings();
  await prisma.shippingSettings.update({
    where: { id: "default" },
    data: {
      freeShippingThreshold: data.freeShippingThreshold,
      flatRate: data.flatRate,
      euRate: data.euRate,
      countryRates: JSON.stringify(data.countryRates),
    },
  });
}
