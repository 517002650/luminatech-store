import { formatOrderId, parseOrderItems, type OrderItem } from "@/lib/orders";

export type Ga4PurchasePayload = {
  transaction_id: string;
  value: number;
  currency: string;
  coupon?: string;
  tax?: number;
  shipping?: number;
  items: {
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }[];
};

export function orderToGa4Purchase(order: {
  id: string;
  total: number;
  taxAmount?: number | null;
  shippingFee?: number | null;
  couponCode?: string | null;
  items: string;
}): Ga4PurchasePayload {
  const lines = parseOrderItems(order.items);
  return {
    transaction_id: formatOrderId(order.id),
    value: order.total,
    currency: "USD",
    coupon: order.couponCode || undefined,
    tax: order.taxAmount ?? undefined,
    shipping: order.shippingFee ?? undefined,
    items: lines.map((item: OrderItem) => {
      const option =
        item.variantNameEn || item.variantNameZh || item.variantSku || "";
      const base = item.nameEn || item.nameZh;
      return {
        item_id: item.variantId || item.productId || item.slug,
        item_name: option ? `${base} (${option})` : base,
        price: item.price,
        quantity: item.quantity,
      };
    }),
  };
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackGa4Purchase(payload: Ga4PurchasePayload) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem("lt_analytics_consent") !== "granted") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", "purchase", {
    transaction_id: payload.transaction_id,
    value: payload.value,
    currency: payload.currency,
    coupon: payload.coupon,
    tax: payload.tax,
    shipping: payload.shipping,
    items: payload.items,
  });
}
