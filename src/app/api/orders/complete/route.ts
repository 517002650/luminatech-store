import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-order";
import { validateCouponCode, incrementCouponUsage } from "@/lib/coupons";
import { buildOrderQuote } from "@/lib/pricing";
import { sendOrderConfirmationEmail } from "@/lib/email";

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
  couponCode?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CompleteOrderBody;
    const { provider, sessionId, paypalOrderId, items, shippingAddress, couponCode } = body;

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

      const couponResult = await validateCouponCode(couponCode, items);
      if (couponCode?.trim() && !couponResult.valid) {
        return NextResponse.json({ error: "优惠码无效" }, { status: 400 });
      }

      const quote = await buildOrderQuote(
        items,
        resolvedShipping,
        couponResult.discountAmount,
        couponResult.couponCode,
      );

      const user = await getCurrentUser();
      let email = resolvedShipping.email;
      if (user && !email) {
        email = user.email;
      }

      const order = await prisma.order.create({
        data: {
          userId: user?.id,
          email,
          subtotal: quote.subtotal,
          shippingFee: quote.shippingFee,
          taxAmount: quote.taxAmount,
          discountAmount: quote.discountAmount,
          couponCode: quote.couponCode ?? "",
          total: quote.total,
          status: "paid",
          paymentMethod: "paypal",
          paymentId,
          items: JSON.stringify(items),
          shippingAddress: JSON.stringify(resolvedShipping),
        },
      });

      if (quote.couponCode) {
        await incrementCouponUsage(quote.couponCode);
      }

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
