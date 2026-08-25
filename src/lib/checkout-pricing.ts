import type Stripe from "stripe";
import {
  buildOrderQuote,
  quoteToMetadata,
  roundMoney,
  type OrderQuote,
} from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/orders";
import { isStripeTaxEnabled } from "@/lib/stripe-tax";

type CheckoutItem = {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantNameEn?: string;
  variantNameZh?: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export function buildStripeLineItems(
  items: CheckoutItem[],
  quote: OrderQuote,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const discountRatio =
    quote.subtotal > 0
      ? (quote.subtotal - quote.discountAmount) / quote.subtotal
      : 1;

  const taxBehavior: Stripe.Checkout.SessionCreateParams.LineItem.PriceData["tax_behavior"] =
    isStripeTaxEnabled() ? "exclusive" : undefined;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => {
      const option =
        item.variantNameEn ||
        item.variantNameZh ||
        item.variantSku ||
        "";
      const displayName = option ? `${item.name} — ${option}` : item.name;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: displayName,
            images: item.image.startsWith("http") ? [item.image] : undefined,
          },
          unit_amount: Math.max(
            0,
            Math.round(item.price * 100 * discountRatio),
          ),
          ...(taxBehavior ? { tax_behavior: taxBehavior } : {}),
        },
        quantity: item.quantity,
      };
    },
  );

  if (quote.shippingFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Shipping" },
        unit_amount: Math.round(quote.shippingFee * 100),
        ...(taxBehavior ? { tax_behavior: taxBehavior } : {}),
      },
      quantity: 1,
    });
  }

  // Flat-rate tax as a line item only when Stripe Tax is OFF.
  if (!isStripeTaxEnabled() && quote.taxAmount > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: quote.taxLabel },
        unit_amount: Math.round(quote.taxAmount * 100),
      },
      quantity: 1,
    });
  }

  return lineItems;
}

export function buildCheckoutMetadata(
  address: ShippingAddress,
  items: CheckoutItem[],
  quote: OrderQuote,
) {
  const pricing = quoteToMetadata(quote);
  return {
    shipping: JSON.stringify(address),
    items: JSON.stringify(
      items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        variantSku: item.variantSku,
        variantNameEn: item.variantNameEn,
        variantNameZh: item.variantNameZh,
        slug: item.slug,
        nameEn: item.nameEn,
        nameZh: item.nameZh,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    ),
    subtotal: String(pricing.subtotal),
    shippingFee: String(pricing.shippingFee),
    taxAmount: String(pricing.taxAmount),
    discountAmount: String(pricing.discountAmount),
    couponCode: pricing.couponCode,
    taxMode: isStripeTaxEnabled() ? "stripe" : "estimate",
  };
}

export async function verifyQuoteTotal(quote: OrderQuote, items: CheckoutItem[]) {
  const rebuilt = await buildOrderQuote(
    items,
    { country: quote.countryCode === "OTHER" ? "Other" : quote.countryCode },
    quote.discountAmount,
    quote.couponCode,
  );
  return roundMoney(rebuilt.total) === roundMoney(quote.total);
}
