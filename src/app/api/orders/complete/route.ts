import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-order";
import { validateCouponCode, incrementCouponUsage } from "@/lib/coupons";
import { buildOrderQuote } from "@/lib/pricing";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { orderToGa4Purchase } from "@/lib/analytics";
import {
  CartValidationError,
  decrementStockForItems,
  resolveCartItemsFromDb,
} from "@/lib/cart-validation";
import {
  AFFILIATE_COOKIE,
  createCommissionForOrder,
  resolveCheckoutAttribution,
} from "@/lib/affiliates";

type CompleteOrderBody = {
  provider: "stripe" | "paypal";
  sessionId?: string;
  paypalOrderId?: string;
  items?: { productId: string; quantity: number; variantId?: string }[];
  shippingAddress?: ShippingAddress;
  couponCode?: string;
  affiliateCode?: string;
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

      const order = await prisma.order.findUnique({
        where: { id: result.orderId },
      });

      return NextResponse.json({
        orderId: result.orderId,
        duplicate: result.duplicate,
        purchase: order ? orderToGa4Purchase(order) : undefined,
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
        return NextResponse.json({
          orderId: existing.id,
          duplicate: true,
          purchase: orderToGa4Purchase(existing),
        });
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

      const attribution = await resolveCheckoutAttribution({
        couponAffiliateId: couponResult.affiliateId,
        couponAffiliateCode: couponResult.affiliateCode,
        couponCommissionRate: couponResult.commissionRate,
        linkCandidates: [
          req.cookies.get(AFFILIATE_COOKIE)?.value,
          body.affiliateCode,
        ],
      });

      let order;
      try {
        order = await prisma.$transaction(async (tx) => {
          const stockOk = await decrementStockForItems(trustedItems, tx);
          if (!stockOk) {
            throw new CartValidationError("Insufficient stock", "out_of_stock");
          }
          return tx.order.create({
            data: {
              userId: user?.id,
              email,
              subtotal: quote.subtotal,
              shippingFee: quote.shippingFee,
              taxAmount: quote.taxAmount,
              discountAmount: quote.discountAmount,
              couponCode: quote.couponCode ?? "",
              affiliateCode: attribution?.affiliateCode ?? "",
              affiliateId: attribution?.affiliateId,
              total: quote.total,
              status: "paid",
              paymentMethod: "paypal",
              paymentId,
              stockApplied: true,
              items: JSON.stringify(trustedItems),
              shippingAddress: JSON.stringify(resolvedShipping),
            },
          });
        });
      } catch (err) {
        if (err instanceof CartValidationError && err.code === "out_of_stock") {
          return NextResponse.json(
            { error: "库存不足，无法完成订单" },
            { status: 409 },
          );
        }
        throw err;
      }

      if (quote.couponCode) {
        await incrementCouponUsage(quote.couponCode);
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

      return NextResponse.json({
        orderId: order.id,
        purchase: orderToGa4Purchase(order),
      });
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
