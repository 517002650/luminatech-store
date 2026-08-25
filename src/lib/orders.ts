import { getCountryLabel } from "@/lib/countries";

export type OrderItem = {
  productId: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  price: number;
  quantity: number;
  image: string;
  /** Present when the line was sold as a specific variant. */
  variantId?: string;
  variantSku?: string;
  variantNameEn?: string;
  variantNameZh?: string;
  /** Snapshot at checkout for export commercial invoice. */
  hsCode?: string;
  originCountry?: string;
  customsDescEn?: string;
  weightGrams?: number;
  /** Snapshot: purchase auto-delivers (download / no logistics). */
  autoDeliver?: boolean;
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

/** Normal forward path (no cancel — cancel only via refund panel). */
const FORWARD_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  paid: ["processing"],
  processing: ["shipped"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Allowed next statuses for normal operators (no cancel, no backward). */
export function getAllowedNextStatuses(current: string): OrderStatus[] {
  if (!isOrderStatus(current)) return [];
  return FORWARD_TRANSITIONS[current];
}

export function canTransitionOrderStatus(
  from: string,
  to: string,
  options?: { force?: boolean },
): { ok: true } | { ok: false; error: string } {
  if (!isOrderStatus(from) || !isOrderStatus(to)) {
    return { ok: false, error: "无效的订单状态" };
  }
  if (from === to) return { ok: true };

  if (to === "cancelled") {
    return {
      ok: false,
      error: "请使用下方「退款 / 取消」面板处理取消与退款，不要直接改状态",
    };
  }

  if (options?.force) {
    if (from === "cancelled") {
      return {
        ok: false,
        error: "已取消订单不能强制改回其他状态（避免库存/资金错乱）",
      };
    }
    return { ok: true };
  }

  const allowed = FORWARD_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      error: `不能从「${ORDER_STATUS_LABELS[from]}」直接改为「${ORDER_STATUS_LABELS[to]}」。请按 已付款→处理中→已发货→已完成 顺序操作。`,
    };
  }
  return { ok: true };
}

/** Line selection for RMA (subset of order items). */
export type ReturnLineSelection = {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  nameZh?: string;
  nameEn?: string;
};

export function parseReturnItemsJson(raw: string | null | undefined): ReturnLineSelection[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: ReturnLineSelection[] = [];
    for (const row of parsed) {
      const r = row as Record<string, unknown>;
      const productId = String(r.productId ?? "").trim();
      const quantity = Math.floor(Number(r.quantity));
      const price = Number(r.price);
      if (!productId || !Number.isFinite(quantity) || quantity < 1) continue;
      out.push({
        productId,
        variantId: String(r.variantId ?? "").trim() || undefined,
        quantity,
        price: Number.isFinite(price) ? price : 0,
        nameZh: String(r.nameZh ?? "") || undefined,
        nameEn: String(r.nameEn ?? "") || undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function returnLinesMerchandiseTotal(lines: ReturnLineSelection[]) {
  return lines.reduce((n, l) => n + l.price * l.quantity, 0);
}

function lineKey(productId: string, variantId?: string) {
  return variantId ? `${productId}:${variantId}` : productId;
}

/** True when selected return lines cover every unit on the order. */
export function returnLinesCoverWholeOrder(
  orderItems: OrderItem[],
  returnLines: ReturnLineSelection[],
): boolean {
  if (returnLines.length === 0) return true;
  const need = new Map<string, number>();
  for (const item of orderItems) {
    const key = lineKey(item.productId, item.variantId);
    need.set(key, (need.get(key) ?? 0) + item.quantity);
  }
  const got = new Map<string, number>();
  for (const line of returnLines) {
    const key = lineKey(line.productId, line.variantId);
    got.set(key, (got.get(key) ?? 0) + line.quantity);
  }
  for (const [key, qty] of need) {
    if ((got.get(key) ?? 0) < qty) return false;
  }
  return true;
}

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

export function formatShippingAddress(addr: ShippingAddress, locale: "en" | "zh" = "en") {
  const countryLabel = getCountryLabel(addr.country, locale);
  const lines = [
    addr.name,
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
    countryLabel,
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
