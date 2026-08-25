"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import {
  parseOrderItems,
  type ReturnLineSelection,
} from "@/lib/orders";

const RETURNABLE = new Set(["shipped", "completed"]);
const OPEN_STATUSES = new Set(["requested", "approved", "received"]);

function lineKey(productId: string, variantId?: string) {
  return variantId ? `${productId}:${variantId}` : productId;
}

export async function createReturnRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "login_required" as const };

  const orderId = String(formData.get("orderId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 80);
  const details = String(formData.get("details") ?? "").trim().slice(0, 2000);

  if (!orderId || !reason) {
    return { error: "incomplete" as const };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "not_found" as const };

  const owns =
    order.userId === user.id ||
    (order.email && order.email.toLowerCase() === user.email.toLowerCase());
  if (!owns) return { error: "not_found" as const };

  if (!RETURNABLE.has(order.status)) {
    return { error: "not_eligible" as const };
  }

  const windowAnchor = order.shippedAt ?? order.updatedAt;
  const daysSince =
    (Date.now() - new Date(windowAnchor).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 30) {
    return { error: "window_expired" as const };
  }

  const existing = await prisma.returnRequest.findFirst({
    where: {
      orderId,
      status: { in: [...OPEN_STATUSES] },
    },
  });
  if (existing) {
    return { error: "already_open" as const };
  }

  const orderItems = parseOrderItems(order.items);
  const selectedRaw = formData.getAll("lineKey").map(String);
  if (selectedRaw.length === 0) {
    return { error: "no_items" as const };
  }

  const qtyByKey = new Map<string, number>();
  for (const key of selectedRaw) {
    const qtyRaw = formData.get(`qty:${key}`);
    const qty = Math.floor(Number(qtyRaw));
    if (!Number.isFinite(qty) || qty < 1) {
      return { error: "invalid_items" as const };
    }
    qtyByKey.set(key, qty);
  }

  const available = new Map(
    orderItems.map((item) => [
      lineKey(item.productId, item.variantId),
      item,
    ]),
  );

  const lines: ReturnLineSelection[] = [];
  for (const [key, qty] of qtyByKey) {
    const item = available.get(key);
    if (!item || qty > item.quantity) {
      return { error: "invalid_items" as const };
    }
    lines.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: qty,
      price: item.price,
      nameZh: item.nameZh,
      nameEn: item.nameEn,
    });
  }

  await prisma.returnRequest.create({
    data: {
      orderId,
      userId: user.id,
      email: user.email,
      reason,
      details,
      itemsJson: JSON.stringify(lines),
      status: "requested",
    },
  });

  revalidatePath(`/en/account/orders/${orderId}`);
  revalidatePath(`/zh/account/orders/${orderId}`);
  revalidatePath("/admin/returns");
  return { success: true as const };
}
