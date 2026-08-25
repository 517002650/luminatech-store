import { prisma } from "@/lib/db";
import { parseOrderItems, type OrderItem } from "@/lib/orders";
import { sendDigitalDeliveryEmail } from "@/lib/email";

export function cartIsAllAutoDeliver(
  items: { autoDeliver?: boolean }[],
): boolean {
  return items.length > 0 && items.every((item) => Boolean(item.autoDeliver));
}

export function orderItemsAllAutoDeliver(itemsJson: string): boolean {
  return cartIsAllAutoDeliver(parseOrderItems(itemsJson));
}

/**
 * Re-read autoDeliver from Product rows.
 * Needed because Stripe metadata historically omitted the flag, and
 * line-item fallbacks also lacked it.
 */
export async function enrichItemsAutoDeliverFromDb(
  items: OrderItem[],
): Promise<OrderItem[]> {
  const ids = [
    ...new Set(
      items
        .map((i) => i.productId)
        .filter((id) => Boolean(id) && id !== "unknown"),
    ),
  ];
  if (ids.length === 0) return items;

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, autoDeliver: true },
  });
  const byId = new Map(products.map((p) => [p.id, p.autoDeliver]));

  return items.map((item) => ({
    ...item,
    // Prefer live product flag; fall back to snapshot if product missing
    autoDeliver:
      byId.has(item.productId)
        ? Boolean(byId.get(item.productId))
        : Boolean(item.autoDeliver),
  }));
}

/**
 * If every line is marked auto-deliver, mark the order shipped immediately
 * (no logistics). Safe to call more than once.
 */
export async function maybeAutoFulfillDigitalOrder(
  orderId: string,
): Promise<{ fulfilled: boolean }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { fulfilled: false };
  if (order.status === "cancelled") return { fulfilled: false };
  if (order.autoDelivered) return { fulfilled: true };

  const items = await enrichItemsAutoDeliverFromDb(parseOrderItems(order.items));
  if (!cartIsAllAutoDeliver(items)) return { fulfilled: false };

  // Persist enriched flags so admin/UI see autoDeliver on lines
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "shipped",
      shippedAt: order.shippedAt ?? new Date(),
      autoDelivered: true,
      shippingCarrier: "digital",
      trackingNumber: "",
      items: JSON.stringify(items),
    },
  });

  try {
    await sendDigitalDeliveryEmail(updated);
  } catch (err) {
    console.error("Digital delivery email failed:", err);
  }

  return { fulfilled: true };
}

export function isDigitalCarrier(carrier: string | null | undefined) {
  return carrier === "digital";
}

export function orderNeedsLogistics(order: {
  autoDelivered?: boolean | null;
  shippingCarrier?: string | null;
  items?: string;
}): boolean {
  if (order.autoDelivered) return false;
  if (isDigitalCarrier(order.shippingCarrier)) return false;
  if (order.items && orderItemsAllAutoDeliver(order.items)) return false;
  return true;
}

export type AutoDeliverLine = Pick<OrderItem, "autoDeliver">;
