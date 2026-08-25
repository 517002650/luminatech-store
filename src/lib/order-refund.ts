import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { restockItems } from "@/lib/cart-validation";
import { parseOrderItems } from "@/lib/orders";
import { roundMoney } from "@/lib/pricing";
import { adjustCommissionOnRefund } from "@/lib/affiliates";

const REFUNDABLE = new Set(["paid", "processing", "shipped", "completed"]);

export type RefundOrderResult =
  | {
      ok: true;
      stripeRefundId?: string;
      alreadyCancelled?: boolean;
      partial?: boolean;
      refundedAmount?: number;
    }
  | { ok: false; error: string };

/**
 * Cancel order (full) or issue a partial Stripe refund.
 * Full cancel restocks when stockApplied. Partial refund does not restock
 * (use for price adjustments / goodwill; return physical goods via RMA full refund).
 */
export async function refundAndCancelOrder(
  orderId: string,
  options?: {
    skipStripe?: boolean;
    reason?: string;
    /** USD amount for partial refund. Omit or >= remaining → full refund + cancel. */
    amount?: number;
  },
): Promise<RefundOrderResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "订单不存在" };

  if (order.status === "cancelled") {
    return { ok: true, alreadyCancelled: true };
  }

  if (!REFUNDABLE.has(order.status)) {
    return { ok: false, error: "当前订单状态不可退款" };
  }

  const alreadyRefunded = roundMoney(order.refundedAmount ?? 0);
  const remaining = roundMoney(order.total - alreadyRefunded);
  if (remaining <= 0) {
    return { ok: false, error: "订单可退余额为 0" };
  }

  const requested =
    typeof options?.amount === "number" && Number.isFinite(options.amount)
      ? roundMoney(options.amount)
      : remaining;

  if (requested <= 0) {
    return { ok: false, error: "退款金额必须大于 0" };
  }
  if (requested > remaining + 0.001) {
    return {
      ok: false,
      error: `退款金额不能超过可退余额 ${remaining.toFixed(2)}`,
    };
  }

  const isFull = requested >= remaining - 0.001;
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
        amount: Math.round(requested * 100),
        reason: "requested_by_customer",
        metadata: {
          orderId: order.id,
          note: options?.reason?.slice(0, 200) ?? "",
          partial: isFull ? "false" : "true",
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

  const newRefunded = roundMoney(alreadyRefunded + requested);
  const items = parseOrderItems(order.items);

  if (isFull) {
    await prisma.$transaction(async (tx) => {
      if (order.stockApplied) {
        await restockItems(items, tx);
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "cancelled",
          stockApplied: false,
          refundedAmount: newRefunded,
        },
      });
      await adjustCommissionOnRefund(
        order.id,
        { full: true, orderTotal: order.total, refundedTotal: newRefunded },
        tx,
      );
    });
    return { ok: true, stripeRefundId, refundedAmount: newRefunded };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { refundedAmount: newRefunded },
    });
    await adjustCommissionOnRefund(
      order.id,
      { full: false, orderTotal: order.total, refundedTotal: newRefunded },
      tx,
    );
  });

  return {
    ok: true,
    stripeRefundId,
    partial: true,
    refundedAmount: newRefunded,
  };
}

/**
 * Refund a paid Stripe Checkout session without an order row
 * (e.g. stock failure after payment succeeded).
 */
export async function refundStripeCheckoutSession(
  sessionId: string,
  reason: string,
): Promise<{ ok: true; refundId: string } | { ok: false; error: string }> {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      return { ok: false, error: "找不到 PaymentIntent，无法自动退款" };
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: { note: reason.slice(0, 200), sessionId },
    });
    return { ok: true, refundId: refund.id };
  } catch (err) {
    console.error("Stripe session refund failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Stripe 退款失败",
    };
  }
}
