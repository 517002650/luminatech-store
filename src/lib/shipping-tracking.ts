export const SHIPPING_CARRIERS = [
  { code: "dhl", labelEn: "DHL", labelZh: "DHL" },
  { code: "fedex", labelEn: "FedEx", labelZh: "FedEx" },
  { code: "ups", labelEn: "UPS", labelZh: "UPS" },
  { code: "usps", labelEn: "USPS", labelZh: "USPS" },
  { code: "sf", labelEn: "SF Express", labelZh: "顺丰速运" },
  { code: "ems", labelEn: "EMS", labelZh: "EMS" },
  { code: "yto", labelEn: "YTO", labelZh: "圆通速递" },
  { code: "zto", labelEn: "ZTO", labelZh: "中通快递" },
  { code: "yunda", labelEn: "Yunda", labelZh: "韵达快递" },
  { code: "sto", labelEn: "STO", labelZh: "申通快递" },
  { code: "jd", labelEn: "JD Logistics", labelZh: "京东物流" },
  { code: "china_post", labelEn: "China Post", labelZh: "中国邮政" },
  { code: "yunexpress", labelEn: "YunExpress", labelZh: "云途物流" },
  { code: "4px", labelEn: "4PX", labelZh: "递四方" },
  { code: "yanwen", labelEn: "Yanwen", labelZh: "燕文物流" },
  { code: "digital", labelEn: "Online delivery", labelZh: "在线交付" },
  { code: "other", labelEn: "Other (17TRACK)", labelZh: "其他 (17TRACK)" },
] as const;

export type ShippingCarrierCode = (typeof SHIPPING_CARRIERS)[number]["code"];

export function getCarrierLabel(carrier: string, locale: "zh" | "en" = "zh") {
  const row = SHIPPING_CARRIERS.find((c) => c.code === carrier);
  if (!row) return carrier || (locale === "zh" ? "其他" : "Other");
  return locale === "zh" ? row.labelZh : row.labelEn;
}

/** Digits-only phone helper for SF / aggregator queries. */
export function phoneLast4(phone: string | null | undefined) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return digits.slice(-4);
}

/** Free public tracking page (17TRACK) — no API key / fee. */
function track17(trackingNumber: string, locale: "zh" | "en" = "zh") {
  const num = encodeURIComponent(trackingNumber.trim());
  const lang = locale === "zh" ? "zh-cn" : "en";
  return `https://t.17track.net/${lang}#nums=${num}`;
}

function kuaidi100(
  companyCode: string,
  trackingNumber: string,
  phone?: string | null,
) {
  const num = encodeURIComponent(trackingNumber.trim());
  const last4 = phoneLast4(phone);
  const base = `https://www.kuaidi100.com/chaxun?com=${encodeURIComponent(companyCode)}&nu=${num}`;
  return last4 ? `${base}&phone=${encodeURIComponent(last4)}` : base;
}

/**
 * Deep-link to carrier or aggregator tracking pages.
 * Free for end users (opens public websites). No paid tracking API.
 * SF Express usually requires recipient phone last-4 — pass options.phone when available.
 */
export function getTrackingUrl(
  carrier: string,
  trackingNumber: string,
  locale: "zh" | "en" = "zh",
  options?: { phone?: string | null },
) {
  const raw = trackingNumber.trim();
  if (!raw) return null;
  const num = encodeURIComponent(raw);
  const phone = options?.phone;

  switch (carrier) {
    case "dhl":
      return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${num}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    case "ups":
      return `https://www.ups.com/track?tracknum=${num}`;
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
    case "sf":
      // Official SF deep-links are unreliable; 快递100 needs phone last-4 for SF.
      return locale === "zh"
        ? kuaidi100("shunfeng", raw, phone)
        : track17(raw, "en");
    case "ems":
      return locale === "zh"
        ? kuaidi100("ems", raw, phone)
        : `https://www.ems.post/en/global-network/tracking?q=${num}`;
    case "yto":
      return locale === "zh"
        ? kuaidi100("yuantong", raw, phone)
        : track17(raw, locale);
    case "zto":
      return locale === "zh"
        ? kuaidi100("zhongtong", raw, phone)
        : track17(raw, locale);
    case "yunda":
      return locale === "zh"
        ? kuaidi100("yunda", raw, phone)
        : track17(raw, locale);
    case "sto":
      return locale === "zh"
        ? kuaidi100("shentong", raw, phone)
        : track17(raw, locale);
    case "jd":
      return locale === "zh"
        ? kuaidi100("jd", raw, phone)
        : track17(raw, locale);
    case "china_post":
      return locale === "zh"
        ? kuaidi100("youzhengguonei", raw, phone)
        : track17(raw, locale);
    case "digital":
      return null;
    case "yunexpress":
    case "4px":
    case "yanwen":
    case "other":
      return track17(raw, locale);
    default:
      return track17(raw, locale);
  }
}

export function hasTrackingInfo(order: {
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
}) {
  return Boolean(order.trackingNumber?.trim());
}
