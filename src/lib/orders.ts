export type OrderItem = {
  productId: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  price: number;
  quantity: number;
  image: string;
};

export const ORDER_STATUSES = [
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "已付款",
  processing: "处理中",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
};

export function parseOrderItems(items: string): OrderItem[] {
  try {
    return JSON.parse(items) as OrderItem[];
  } catch {
    return [];
  }
}

export function formatOrderId(id: string) {
  return id.slice(-8).toUpperCase();
}

export type ShippingAddress = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

export function parseShippingAddress(raw: string): ShippingAddress | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<ShippingAddress>;
    if (!data.name || !data.line1 || !data.city || !data.country || !data.postalCode) {
      return null;
    }
    return {
      name: data.name,
      phone: data.phone ?? "",
      email: data.email ?? "",
      line1: data.line1,
      line2: data.line2,
      city: data.city,
      state: data.state ?? "",
      country: data.country,
      postalCode: data.postalCode,
    };
  } catch {
    return null;
  }
}

export function formatShippingAddress(addr: ShippingAddress) {
  const lines = [
    addr.name,
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
    addr.country,
  ].filter(Boolean);
  if (addr.phone) lines.push(addr.phone);
  return lines.join("\n");
}

export function validateShippingAddress(
  addr: Partial<ShippingAddress>,
): string | null {
  if (!addr.email?.trim()) return "email_required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.email.trim())) return "email_invalid";
  if (!addr.name?.trim()) return "name_required";
  if (!addr.line1?.trim()) return "line1_required";
  if (!addr.city?.trim()) return "city_required";
  if (!addr.country?.trim()) return "country_required";
  if (!addr.postalCode?.trim()) return "postal_required";
  return null;
}

export const SHIPPING_STORAGE_KEY = "luminatech_shipping";
export const COUPON_STORAGE_KEY = "luminatech_coupon";
