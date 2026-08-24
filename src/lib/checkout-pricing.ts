import type Stripe from "stripe";
import {
  buildOrderQuote,
  quoteToMetadata,
  roundMoney,
  type OrderQuote,
} from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/orders";

type CheckoutItem = {
  productId: string;
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

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image.startsWith("http") ? [item.image] : undefined,
        },
        unit_amount: Math.max(
          0,
          Math.round(item.price * 100 * discountRatio),
        ),
      },
      quantity: item.quantity,
    }),
  );

  if (quote.shippingFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Shipping" },
        unit_amount: Math.round(quote.shippingFee * 100),
      },
      quantity: 1,
    });
  }

  if (quote.taxAmount > 0) {
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
