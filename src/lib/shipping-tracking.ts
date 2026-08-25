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
  { code: "other", labelEn: "Other (17TRACK)", labelZh: "其他 (17TRACK)" },
] as const;

export type ShippingCarrierCode = (typeof SHIPPING_CARRIERS)[number]["code"];

export function getCarrierLabel(carrier: string, locale: "zh" | "en" = "zh") {
  const row = SHIPPING_CARRIERS.find((c) => c.code === carrier);
  if (!row) return carrier || (locale === "zh" ? "其他" : "Other");
  return locale === "zh" ? row.labelZh : row.labelEn;
}

export function getTrackingUrl(carrier: string, trackingNumber: string) {
  const num = encodeURIComponent(trackingNumber.trim());
  if (!num) return null;

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
      return `https://www.sf-express.com/chn/sc/dynamic_function/waybill/#search/bill-number/${num}`;
    case "ems":
      return `https://www.ems.post/en/global-network/tracking?q=${num}`;
    case "yto":
      return `https://www.yto.net.cn/`;
    case "zto":
      return `https://www.zto.com/`;
    case "yunda":
      return `https://www.yundaex.com/`;
    case "sto":
      return `https://www.sto.cn/`;
    case "jd":
      return `https://www.jdl.com/`;
    case "china_post":
      return `https://www.chinapost.com.cn/`;
    default:
      return `https://t.17track.net/en#nums=${num}`;
  }
}

export function hasTrackingInfo(order: {
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
}) {
  return Boolean(order.trackingNumber?.trim());
}
