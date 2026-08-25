import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import {
  decrementStockForItems,
  restockItems,
} from "@/lib/cart-validation";
import { parseOrderItems } from "@/lib/orders";

const REFUNDABLE = new Set(["paid", "processing", "shipped", "completed"]);

export type RefundOrderResult =
  | { ok: true; stripeRefundId?: string }
  | { ok: false; error: string };

/**
 * Cancel order, optionally refund via Stripe, and restock inventory.
 * Idempotent if already cancelled.
 */
export async function refundAndCancelOrder(
  orderId: string,
  options?: { skipStripe?: boolean; reason?: string },
): Promise<RefundOrderResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "订单不存在" };

  if (order.status === "cancelled") {
    return { ok: true };
  }

  if (!REFUNDABLE.has(order.status)) {
    return { ok: false, error: "当前订单状态不可退款" };
  }

  let stripeRefundId: string | undefined;

  if (
    !options?.skipStripe &&
    order.paymentMethod === "stripe" &&
    order.paymentId &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(order.paymentId);
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      if (!paymentIntentId) {
        return {
          ok: false,
          error: "找不到 Stripe 支付记录，无法自动退款。可勾选「仅取消订单」跳过退款。",
        };
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          orderId: order.id,
          note: options?.reason?.slice(0, 200) ?? "",
        },
      });
      stripeRefundId = refund.id;
    } catch (err) {
      console.error("Stripe refund failed:", err);
      return {
        ok: false,
        error:
          err instanceof Error
            ? `Stripe 退款失败：${err.message}`
            : "Stripe 退款失败",
      };
    }
  }

  const items = parseOrderItems(order.items);
  await restockItems(items);

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "cancelled" },
  });

  return { ok: true, stripeRefundId };
}

export { decrementStockForItems };
