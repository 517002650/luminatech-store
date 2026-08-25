import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-order";
import { validateCouponCode, incrementCouponUsage } from "@/lib/coupons";
import { buildOrderQuote } from "@/lib/pricing";
import { sendOrderConfirmationEmail } from "@/lib/email";
import {
  CartValidationError,
  decrementStockForItems,
  resolveCartItemsFromDb,
} from "@/lib/cart-validation";

type CompleteOrderBody = {
  provider: "stripe" | "paypal";
  sessionId?: string;
  paypalOrderId?: string;
  items?: { productId: string; quantity: number }[];
  shippingAddress?: ShippingAddress;
  couponCode?: string;
};

function paypalOrdersAccepted() {
  return process.env.PAYPAL_ENABLED === "true";
}

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
      });

      return NextResponse.json({
        orderId: result.orderId,
        duplicate: result.duplicate,
      });
    }

    if (provider === "paypal") {
      if (!paypalOrdersAccepted()) {
        return NextResponse.json(
          {
            error:
              "PayPal 暂未启用服务端核验，请使用 Stripe 支付。设置 PAYPAL_ENABLED=true 前请先完成 Orders API capture。",
          },
          { status: 503 },
        );
      }

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

      let trustedItems;
      try {
        trustedItems = await resolveCartItemsFromDb(items, "en");
      } catch (err) {
        if (err instanceof CartValidationError) {
          return NextResponse.json(
            { error: err.message, code: err.code },
            { status: 400 },
          );
        }
        throw err;
      }

      const couponResult = await validateCouponCode(couponCode, trustedItems);
      if (couponCode?.trim() && !couponResult.valid) {
        return NextResponse.json({ error: "优惠码无效" }, { status: 400 });
      }

      const quote = await buildOrderQuote(
        trustedItems,
        resolvedShipping,
        couponResult.discountAmount,
        couponResult.couponCode,
      );

      const user = await getCurrentUser();
      let email = resolvedShipping.email;
      if (user && !email) {
        email = user.email;
      }

      const stockOk = await decrementStockForItems(trustedItems);
      if (!stockOk) {
        return NextResponse.json(
          { error: "库存不足，无法完成订单" },
          { status: 409 },
        );
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
          items: JSON.stringify(trustedItems),
          shippingAddress: JSON.stringify(resolvedShipping),
        },
      });

      if (quote.couponCode) {
        await incrementCouponUsage(quote.couponCode);
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
