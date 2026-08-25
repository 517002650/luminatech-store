"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";

const RETURNABLE = new Set(["shipped", "completed"]);
const OPEN_STATUSES = new Set(["requested", "approved", "received"]);

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

  const daysSince =
    (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
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

  await prisma.returnRequest.create({
    data: {
      orderId,
      userId: user.id,
      email: user.email,
      reason,
      details,
      status: "requested",
    },
  });

  revalidatePath(`/en/account/orders/${orderId}`);
  revalidatePath(`/zh/account/orders/${orderId}`);
  revalidatePath("/admin/returns");
  return { success: true as const };
}
