import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-order";

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
  items?: CartItem[];
  shippingAddress?: ShippingAddress;
};

function calcTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CompleteOrderBody;
    const { provider, sessionId, paypalOrderId, items, shippingAddress } = body;

    if (provider === "stripe") {
      if (!sessionId) {
        return NextResponse.json({ error: "缺少 Stripe session" }, { status: 400 });
      }
      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: "Stripe 未配置" }, { status: 500 });
      }

      const user = await getCurrentUser();
      const result = await fulfillStripeCheckoutSession(sessionId, {
        userId: user?.id,
        clientItems: items?.length ? items : undefined,
      });

      return NextResponse.json({
        orderId: result.orderId,
        duplicate: result.duplicate,
      });
    }

    if (provider === "paypal") {
      if (!items?.length) {
        return NextResponse.json({ error: "订单商品为空" }, { status: 400 });
      }
      if (!paypalOrderId) {
        return NextResponse.json({ error: "缺少 PayPal 订单号" }, { status: 400 });
      }

      const paymentId = paypalOrderId;
      const existing = await prisma.order.findUnique({ where: { paymentId } });
      if (existing) {
        return NextResponse.json({ orderId: existing.id, duplicate: true });
      }

      const resolvedShipping = shippingAddress ?? null;
      if (!resolvedShipping) {
        return NextResponse.json({ error: "缺少收货地址" }, { status: 400 });
      }

      const validationError = validateShippingAddress(resolvedShipping);
      if (validationError) {
        return NextResponse.json({ error: "收货地址不完整" }, { status: 400 });
      }

      const user = await getCurrentUser();
      let email = resolvedShipping.email;
      if (user && !email) {
        email = user.email;
      }

      const total = calcTotal(items);
      const order = await prisma.order.create({
        data: {
          userId: user?.id,
          email,
          total,
          status: "paid",
          paymentMethod: "paypal",
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

      return NextResponse.json({ orderId: order.id });
    }

    return NextResponse.json({ error: "未知支付方式" }, { status: 400 });
  } catch (err) {
    console.error("Order complete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建订单失败" },
      { status: 500 },
    );
  }
}
