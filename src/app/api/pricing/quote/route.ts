import { NextRequest, NextResponse } from "next/server";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { validateCouponCode } from "@/lib/coupons";
import { buildOrderQuote } from "@/lib/pricing";

type QuoteBody = {
  items: { price: number; quantity: number }[];
  shippingAddress: Partial<ShippingAddress>;
  couponCode?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteBody;
    const { items, shippingAddress, couponCode } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const addressError = validateShippingAddress(shippingAddress ?? {});
    if (addressError) {
      return NextResponse.json({
        quote: null,
        addressIncomplete: true,
        couponError: null,
      });
    }

    const couponResult = await validateCouponCode(couponCode, items);
    if (couponCode?.trim() && !couponResult.valid) {
      return NextResponse.json({
        quote: null,
        addressIncomplete: false,
        couponError: couponResult.error ?? "invalid",
      });
    }

    const quote = buildOrderQuote(
      items,
      shippingAddress as ShippingAddress,
      couponResult.discountAmount,
      couponResult.couponCode,
    );

    return NextResponse.json({
      quote,
      addressIncomplete: false,
      couponError: null,
    });
  } catch (err) {
    console.error("Pricing quote error:", err);
    return NextResponse.json({ error: "Failed to calculate pricing" }, { status: 500 });
  }
}
