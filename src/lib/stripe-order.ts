import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { incrementCouponUsage } from "@/lib/coupons";
import { parsePricingMetadata } from "@/lib/pricing";
import type { OrderItem, ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { decrementStockForItems } from "@/lib/cart-validation";

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

  let order;
  try {
    order = await prisma.order.create({
      data: {
        userId: options?.userId,
        email,
        subtotal: pricing?.subtotal ?? total,
        shippingFee: pricing?.shippingFee ?? 0,
        taxAmount: pricing?.taxAmount ?? 0,
        discountAmount: pricing?.discountAmount ?? 0,
        couponCode: pricing?.couponCode ?? "",
        total,
        status: "paid",
        paymentMethod: "stripe",
        paymentId,
        items: JSON.stringify(items),
        shippingAddress: JSON.stringify(resolvedShipping),
      },
    });
  } catch (err) {
    const existingAfterRace = await prisma.order.findUnique({ where: { paymentId } });
    if (existingAfterRace) {
      return { orderId: existingAfterRace.id, duplicate: true };
    }
    throw err;
  }

  if (pricing?.couponCode) {
    await incrementCouponUsage(pricing.couponCode);
  }

  const stockOk = await decrementStockForItems(items);
  if (!stockOk) {
    console.error(
      `Order ${order.id} created but stock decrement failed — manual restock/refund may be needed`,
    );
  }

  try {
    await sendOrderConfirmationEmail(order);
  } catch (err) {
    console.error("Order confirmation email failed:", err);
  }

  return { orderId: order.id, duplicate: false };
}
