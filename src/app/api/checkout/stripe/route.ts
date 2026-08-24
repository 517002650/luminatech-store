import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env" },
        { status: 500 },
      );
    }

    const { items, locale = "en", shippingAddress } = (await req.json()) as {
      items: CartItem[];
      locale?: string;
      shippingAddress?: ShippingAddress;
    };

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const validationError = validateShippingAddress(shippingAddress ?? {});
    if (validationError) {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();
    const address = shippingAddress!;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: address.email,
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image.startsWith("http") ? [item.image] : undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      metadata: {
        shipping: JSON.stringify(address),
      },
      success_url: `${appUrl}/${locale}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
