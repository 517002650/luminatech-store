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
  cartRequiresFreightQuote,
  resolveCartItemsFromDb,
} from "@/lib/cart-validation";
import {
  isStripeTaxEnabled,
  shippingAddressForStripeCustomer,
} from "@/lib/stripe-tax";
import { cartIsAllAutoDeliver } from "@/lib/digital-delivery";
import {
  AFFILIATE_COOKIE,
  resolveCheckoutAttribution,
} from "@/lib/affiliates";

type CartRequestBody = {
  items: { productId: string; quantity: number; variantId?: string }[];
  locale?: string;
  shippingAddress?: ShippingAddress;
  couponCode?: string;
  affiliateCode?: string;
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

    const attribution = await resolveCheckoutAttribution({
      couponAffiliateId: couponResult.affiliateId,
      couponAffiliateCode: couponResult.affiliateCode,
      couponCommissionRate: couponResult.commissionRate,
      linkCandidates: [
        req.cookies.get(AFFILIATE_COOKIE)?.value,
        body.affiliateCode,
      ],
    });

    const address = shippingAddress!;
    const quote = await buildOrderQuote(
      items,
      address,
      couponResult.discountAmount,
      couponResult.couponCode,
      undefined,
      { requiresFreightQuote: cartRequiresFreightQuote(items), digitalDelivery: cartIsAllAutoDeliver(items) },
    );

    if (quote.requiresFreightQuote) {
      return NextResponse.json(
        {
          error:
            "This cart includes freight-only items. Please contact us for a shipping quote before checkout.",
          code: "freight_quote_required",
        },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();
    const paymentMethodTypes = getPaymentMethodTypes();
    const lineItems = buildStripeLineItems(items, quote);
    const useStripeTax = isStripeTaxEnabled();

    const baseParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      metadata: buildCheckoutMetadata(address, items, quote, attribution),
      success_url: `${appUrl}/${locale}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/cart`,
    };

    if (useStripeTax) {
      const shipping = shippingAddressForStripeCustomer(address);
      if (!shipping) {
        return NextResponse.json(
          {
            error:
              "Stripe Tax requires a supported shipping country. Please select a country from the list (not Other).",
            code: "tax_country_required",
          },
          { status: 400 },
        );
      }

      const customer = await stripe.customers.create({
        email: address.email,
        name: address.name,
        phone: address.phone || undefined,
        shipping,
        address: shipping.address,
        metadata: { source: "luminatech-checkout" },
      });

      baseParams.customer = customer.id;
      baseParams.customer_update = { address: "auto", shipping: "auto" };
      baseParams.automatic_tax = { enabled: true };
    } else {
      baseParams.customer_email = address.email;
    }

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
