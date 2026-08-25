import {
  getTrackingUrl,
  type ShippingCarrierCode,
} from "@/lib/shipping-tracking";
import { parseShippingAddress } from "@/lib/orders";

export type FulfillmentChannel = "domestic" | "export";

export type FulfillmentChannelMode = "auto" | FulfillmentChannel;

export type CarrierMarket = "domestic" | "export" | "both";

export type FulfillmentCarrier = {
  code: ShippingCarrierCode | string;
  labelEn: string;
  labelZh: string;
  market: CarrierMarket;
};

/**
 * Domestic CN express + common cross-border / intl carriers.
 * Tracking URLs for new codes fall through to 17TRACK in getTrackingUrl.
 */
export const FULFILLMENT_CARRIERS: FulfillmentCarrier[] = [
  // Domestic
  { code: "sf", labelEn: "SF Express", labelZh: "顺丰速运", market: "both" },
  { code: "ems", labelEn: "EMS", labelZh: "EMS", market: "both" },
  { code: "yto", labelEn: "YTO", labelZh: "圆通速递", market: "domestic" },
  { code: "zto", labelEn: "ZTO", labelZh: "中通快递", market: "domestic" },
  { code: "yunda", labelEn: "Yunda", labelZh: "韵达快递", market: "domestic" },
  { code: "sto", labelEn: "STO", labelZh: "申通快递", market: "domestic" },
  { code: "jd", labelEn: "JD Logistics", labelZh: "京东物流", market: "domestic" },
  { code: "china_post", labelEn: "China Post", labelZh: "中国邮政", market: "domestic" },
  // Export / intl
  { code: "dhl", labelEn: "DHL", labelZh: "DHL", market: "export" },
  { code: "fedex", labelEn: "FedEx", labelZh: "FedEx", market: "export" },
  { code: "ups", labelEn: "UPS", labelZh: "UPS", market: "export" },
  { code: "usps", labelEn: "USPS", labelZh: "USPS", market: "export" },
  { code: "yunexpress", labelEn: "YunExpress", labelZh: "云途物流", market: "export" },
  { code: "4px", labelEn: "4PX", labelZh: "递四方", market: "export" },
  { code: "yanwen", labelEn: "Yanwen", labelZh: "燕文物流", market: "export" },
  { code: "other", labelEn: "Other (17TRACK)", labelZh: "其他 (17TRACK)", market: "both" },
];

const DOMESTIC_COUNTRIES = new Set(["CN", "CHINA", "中国"]);

export function normalizeCountryCode(country: string | null | undefined) {
  return String(country ?? "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "");
}

/** Mainland China → domestic; elsewhere → export (HK/MO/TW treated as export). */
export function inferFulfillmentChannelFromCountry(
  country: string | null | undefined,
): FulfillmentChannel {
  const c = normalizeCountryCode(country);
  if (!c) return "export";
  if (DOMESTIC_COUNTRIES.has(c) || c === "PRC") return "domestic";
  if (c.includes("CHINA") && !c.includes("HONG") && !c.includes("TAIWAN")) {
    return "domestic";
  }
  return "export";
}

export function parseFulfillmentChannelMode(
  raw: string | null | undefined,
): FulfillmentChannelMode {
  const v = String(raw ?? "auto").trim().toLowerCase();
  if (v === "domestic" || v === "export") return v;
  return "auto";
}

export function resolveFulfillmentChannel(options: {
  mode?: string | null;
  shippingAddressJson?: string | null;
  country?: string | null;
}): FulfillmentChannel {
  const mode = parseFulfillmentChannelMode(options.mode);
  if (mode !== "auto") return mode;

  const country =
    options.country ??
    parseShippingAddress(options.shippingAddressJson ?? "")?.country ??
    "";
  return inferFulfillmentChannelFromCountry(country);
}

export function getCarriersForChannel(channel: FulfillmentChannel) {
  return FULFILLMENT_CARRIERS.filter(
    (c) => c.market === "both" || c.market === channel,
  );
}

export function getFulfillmentCarrierLabel(
  code: string,
  locale: "zh" | "en" = "zh",
) {
  const row = FULFILLMENT_CARRIERS.find((c) => c.code === code);
  if (!row) return code || (locale === "zh" ? "其他" : "Other");
  return locale === "zh" ? row.labelZh : row.labelEn;
}

export function fulfillmentChannelLabel(
  channel: FulfillmentChannel,
  locale: "zh" | "en" = "zh",
) {
  if (locale === "en") {
    return channel === "domestic" ? "Domestic" : "Export";
  }
  return channel === "domestic" ? "国内快递" : "跨境出口";
}

export function buildBuyerTrackingUrl(carrier: string, trackingNumber: string) {
  return getTrackingUrl(carrier, trackingNumber);
}

/** Ops cue: tracking present but not shipped yet. */
export function isPendingShipWithTracking(order: {
  status: string;
  trackingNumber?: string | null;
}) {
  return (
    ["paid", "processing"].includes(order.status) &&
    Boolean(order.trackingNumber?.trim())
  );
}

/** Ops cue: marked shipped without tracking (ignore digital auto-delivery). */
export function isShippedWithoutTracking(order: {
  status: string;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
  autoDelivered?: boolean | null;
}) {
  if (order.autoDelivered || order.shippingCarrier === "digital") return false;
  return (
    ["shipped", "completed"].includes(order.status) &&
    !order.trackingNumber?.trim()
  );
}
