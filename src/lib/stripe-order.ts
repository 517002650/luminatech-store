import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { incrementCouponUsage } from "@/lib/coupons";
import { parsePricingMetadata, roundMoney } from "@/lib/pricing";
import type { OrderItem, ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import {
  decrementStockForItemsOrThrow,
  StockDecrementError,
} from "@/lib/cart-validation";
import { refundStripeCheckoutSession } from "@/lib/order-refund";
import { isStripeTaxEnabled } from "@/lib/stripe-tax";
import { createCommissionForOrder } from "@/lib/affiliates";

function parseMetadataShipping(raw: string | null | undefined): ShippingAddress | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShippingAddress;
  } catch {
    return null;
  }
}

function parseMetadataItems(raw: string | null | undefined): OrderItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OrderItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function buildItemsFromLineItems(
  session: Stripe.Checkout.Session,
): Promise<OrderItem[]> {
  const stripe = getStripe();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });

  const items: OrderItem[] = [];

  for (const line of lineItems.data) {
    const name = line.description ?? line.price?.product?.toString() ?? "Product";
    const price = (line.price?.unit_amount ?? line.amount_total ?? 0) / 100;
    const quantity = line.quantity ?? 1;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ nameEn: name }, { nameZh: name }],
      },
    });

    items.push({
      productId: product?.id ?? "unknown",
      slug: product?.slug ?? "unknown",
      nameEn: product?.nameEn ?? name,
      nameZh: product?.nameZh ?? name,
      price: product?.price ?? price,
      quantity,
      image: product?.image ?? "",
      autoDeliver: Boolean(product?.autoDeliver),
    });
  }

  return items;
}

export type FulfillStripeResult =
  | { orderId: string; duplicate: true }
  | { orderId: string; duplicate: false };

export async function fulfillStripeCheckoutSession(
  sessionId: string,
  options?: { userId?: string },
): Promise<FulfillStripeResult> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("支付未完成");
  }

  const paymentId = session.id;

  const existing = await prisma.order.findUnique({ where: { paymentId } });
  if (existing) {
    try {
      const { maybeAutoFulfillDigitalOrder } = await import(
        "@/lib/digital-delivery"
      );
      await maybeAutoFulfillDigitalOrder(existing.id);
    } catch (err) {
      console.error("Auto digital fulfill (duplicate path) failed:", err);
    }
    return { orderId: existing.id, duplicate: true };
  }

  // Prefer Stripe metadata locked at checkout (DB prices). Never trust client cart.
  let items = parseMetadataItems(session.metadata?.items);

  if (!items.length) {
    items = await buildItemsFromLineItems(session);
  }

  if (!items.length) {
    throw new Error("无法解析订单商品");
  }

  // Ensure autoDeliver flags exist even if metadata omitted them
  {
    const { enrichItemsAutoDeliverFromDb } = await import(
      "@/lib/digital-delivery"
    );
    items = await enrichItemsAutoDeliverFromDb(items);
  }

  const resolvedShipping = parseMetadataShipping(session.metadata?.shipping);
  if (!resolvedShipping) {
    throw new Error("缺少收货地址");
  }

  const validationError = validateShippingAddress(resolvedShipping);
  if (validationError) {
    throw new Error("收货地址不完整");
  }

  let email =
    session.customer_details?.email ??
    session.customer_email ??
    resolvedShipping.email;

  if (!email && options?.userId) {
    const user = await prisma.user.findUnique({ where: { id: options.userId } });
    email = user?.email ?? "";
  }

  const total = (session.amount_total ?? 0) / 100;
  const pricing = parsePricingMetadata(session.metadata ?? undefined);
  const affiliateId = session.metadata?.affiliateId?.trim() || null;
  const affiliateCode = session.metadata?.affiliateCode?.trim() || "";

  // Prefer Stripe Tax amount when automatic tax was used.
  const stripeTaxCents = session.total_details?.amount_tax;
  const taxAmount =
    isStripeTaxEnabled() && typeof stripeTaxCents === "number"
      ? stripeTaxCents / 100
      : (pricing?.taxAmount ?? 0);

  // Never fall back to payment total for subtotal — that includes shipping/tax
  // and would inflate commission base.
  const itemsSubtotal = roundMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const subtotal = pricing?.subtotal ?? itemsSubtotal;
  const shippingFee = pricing?.shippingFee ?? 0;
  const discountAmount = pricing?.discountAmount ?? 0;

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      await decrementStockForItemsOrThrow(items, tx);
      return tx.order.create({
        data: {
          userId: options?.userId,
          email,
          subtotal,
          shippingFee,
          taxAmount,
          discountAmount,
          couponCode: pricing?.couponCode ?? "",
          affiliateCode,
          affiliateId: affiliateId || undefined,
          total,
          status: "paid",
          paymentMethod: "stripe",
          paymentId,
          stockApplied: true,
          items: JSON.stringify(items),
          shippingAddress: JSON.stringify(resolvedShipping),
        },
      });
    });
  } catch (err) {
    const existingAfterRace = await prisma.order.findUnique({ where: { paymentId } });
    if (existingAfterRace) {
      return { orderId: existingAfterRace.id, duplicate: true };
    }

    if (err instanceof StockDecrementError) {
      const refund = await refundStripeCheckoutSession(
        sessionId,
        `Auto-refund: insufficient stock (${err.productId})`,
      );
      console.error(
        `Stock failed for session ${sessionId}; auto-refund ${refund.ok ? refund.refundId : refund.error}`,
      );
      throw new Error(
        refund.ok
          ? "库存不足，付款已自动退回。请稍后再试或联系客服。"
          : `库存不足且自动退款失败，请联系客服并提供支付号 ${sessionId}`,
      );
    }

    throw err;
  }

  if (pricing?.couponCode) {
    await incrementCouponUsage(pricing.couponCode);
  }

  try {
    await createCommissionForOrder(order);
  } catch (err) {
    console.error("Commission create failed:", err);
  }

  try {
    await sendOrderConfirmationEmail(order);
  } catch (err) {
    console.error("Order confirmation email failed:", err);
  }

  try {
    const { maybeAutoFulfillDigitalOrder } = await import("@/lib/digital-delivery");
    await maybeAutoFulfillDigitalOrder(order.id);
  } catch (err) {
    console.error("Auto digital fulfill failed:", err);
  }

  return { orderId: order.id, duplicate: false };
}
