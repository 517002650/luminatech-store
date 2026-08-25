import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { validateCouponCode } from "@/lib/coupons";
import { buildOrderQuote } from "@/lib/pricing";
import {
  buildCheckoutMetadata,
  buildStripeLineItems,
} from "@/lib/checkout-pricing";
import {
  CartValidationError,
  resolveCartItemsFromDb,
} from "@/lib/cart-validation";

type CartRequestBody = {
  items: { productId: string; quantity: number }[];
  locale?: string;
  shippingAddress?: ShippingAddress;
  couponCode?: string;
};

/** Default: card + Alipay + WeChat Pay via Stripe Checkout */
function getPaymentMethodTypes(): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const raw = process.env.STRIPE_PAYMENT_METHODS?.trim();
  if (!raw) {
    return ["card", "alipay", "wechat_pay"];
  }
  const allowed = new Set(["card", "alipay", "wechat_pay"]);
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Stripe.Checkout.SessionCreateParams.PaymentMethodType =>
      allowed.has(s),
    );
  return list.length > 0 ? list : ["card"];
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env" },
        { status: 500 },
      );
    }

    const body = (await req.json()) as CartRequestBody;
    const { locale = "en", shippingAddress, couponCode } = body;

    const validationError = validateShippingAddress(shippingAddress ?? {});
    if (validationError) {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 });
    }

    const localeKey = locale === "zh" ? "zh" : "en";
    let items;
    try {
      items = await resolveCartItemsFromDb(body.items ?? [], localeKey);
    } catch (err) {
      if (err instanceof CartValidationError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: 400 },
        );
      }
      throw err;
    }

    const couponResult = await validateCouponCode(couponCode, items);
    if (couponCode?.trim() && !couponResult.valid) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    const address = shippingAddress!;
    const quote = await buildOrderQuote(
      items,
      address,
      couponResult.discountAmount,
      couponResult.couponCode,
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();
    const paymentMethodTypes = getPaymentMethodTypes();
    const lineItems = buildStripeLineItems(items, quote);

    const baseParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      customer_email: address.email,
      line_items: lineItems,
      metadata: buildCheckoutMetadata(address, items, quote),
      success_url: `${appUrl}/${locale}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/cart`,
    };

    if (paymentMethodTypes.includes("wechat_pay")) {
      baseParams.payment_method_options = {
        wechat_pay: { client: "web" },
      };
    }

    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.create({
        ...baseParams,
        payment_method_types: paymentMethodTypes,
      });
    } catch (primaryErr) {
      const message =
        primaryErr instanceof Error ? primaryErr.message.toLowerCase() : "";
      const shouldFallback =
        paymentMethodTypes.some((m) => m !== "card") &&
        (message.includes("payment method") ||
          message.includes("alipay") ||
          message.includes("wechat") ||
          message.includes("invalid") ||
          message.includes("activated"));

      if (!shouldFallback) throw primaryErr;

      console.warn(
        "Stripe Alipay/WeChat unavailable, falling back to card-only:",
        primaryErr,
      );
      session = await stripe.checkout.sessions.create({
        ...baseParams,
        payment_method_types: ["card"],
        payment_method_options: undefined,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
