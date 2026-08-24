import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/user-auth";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";

type CartItem = {
  productId: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  price: number;
  quantity: number;
  image: string;
};

type CompleteOrderBody = {
  provider: "stripe" | "paypal";
  sessionId?: string;
  paypalOrderId?: string;
  items: CartItem[];
  shippingAddress?: ShippingAddress;
};

function calcTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function parseMetadataShipping(raw: string | null | undefined): ShippingAddress | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShippingAddress;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CompleteOrderBody;
    const { provider, sessionId, paypalOrderId, items, shippingAddress } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "订单商品为空" }, { status: 400 });
    }

    let email = "";
    let paymentId = "";
    let total = calcTotal(items);
    let resolvedShipping = shippingAddress ?? null;

    if (provider === "stripe") {
      if (!sessionId) {
        return NextResponse.json({ error: "缺少 Stripe session" }, { status: 400 });
      }
      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: "Stripe 未配置" }, { status: 500 });
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "支付未完成" }, { status: 400 });
      }

      email = session.customer_details?.email ?? session.customer_email ?? "";
      paymentId = session.id;
      total = (session.amount_total ?? 0) / 100;

      if (!resolvedShipping) {
        resolvedShipping = parseMetadataShipping(session.metadata?.shipping);
      }
    } else if (provider === "paypal") {
      if (!paypalOrderId) {
        return NextResponse.json({ error: "缺少 PayPal 订单号" }, { status: 400 });
      }
      paymentId = paypalOrderId;
    } else {
      return NextResponse.json({ error: "未知支付方式" }, { status: 400 });
    }

    const existing = paymentId
      ? await prisma.order.findUnique({ where: { paymentId } })
      : null;

    if (existing) {
      return NextResponse.json({ orderId: existing.id, duplicate: true });
    }

    const user = await getCurrentUser();

    if (!resolvedShipping) {
      return NextResponse.json({ error: "缺少收货地址" }, { status: 400 });
    }

    const validationError = validateShippingAddress(resolvedShipping);
    if (validationError) {
      return NextResponse.json({ error: "收货地址不完整" }, { status: 400 });
    }

    if (!email) {
      email = resolvedShipping.email;
    }
    if (user && !email) {
      email = user.email;
    }

    const order = await prisma.order.create({
      data: {
        userId: user?.id,
        email,
        total,
        status: "paid",
        paymentMethod: provider,
        paymentId,
        items: JSON.stringify(items),
        shippingAddress: JSON.stringify(resolvedShipping),
      },
    });

    for (const item of items) {
      await prisma.product.updateMany({
        where: { id: item.productId, stock: { gt: 0 } },
        data: { stock: { decrement: item.quantity } },
      });
    }

    try {
      await sendOrderConfirmationEmail(order);
    } catch (err) {
      console.error("Order confirmation email failed:", err);
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("Order complete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建订单失败" },
      { status: 500 },
    );
  }
}
