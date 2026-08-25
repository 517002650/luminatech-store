import { NextRequest, NextResponse } from "next/server";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";
import { validateCouponCode } from "@/lib/coupons";
import { buildOrderQuote } from "@/lib/pricing";
import {
  CartValidationError,
  cartRequiresFreightQuote,
  resolveCartItemsFromDb,
} from "@/lib/cart-validation";
import { cartIsAllAutoDeliver } from "@/lib/digital-delivery";

type QuoteBody = {
  items: { productId: string; quantity: number }[];
  shippingAddress: Partial<ShippingAddress>;
  couponCode?: string;
  locale?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteBody;
    const { items, shippingAddress, couponCode, locale } = body;

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

    let trustedItems;
    try {
      trustedItems = await resolveCartItemsFromDb(
        items,
        locale === "zh" ? "zh" : "en",
      );
    } catch (err) {
      if (err instanceof CartValidationError) {
        return NextResponse.json({
          quote: null,
          addressIncomplete: false,
          couponError: null,
          stockError: err.code,
          error: err.message,
        });
      }
      throw err;
    }

    const couponResult = await validateCouponCode(couponCode, trustedItems);
    if (couponCode?.trim() && !couponResult.valid) {
      return NextResponse.json({
        quote: null,
        addressIncomplete: false,
        couponError: couponResult.error ?? "invalid",
      });
    }

    const quote = await buildOrderQuote(
      trustedItems,
      shippingAddress as ShippingAddress,
      couponResult.discountAmount,
      couponResult.couponCode,
      undefined,
      { requiresFreightQuote: cartRequiresFreightQuote(trustedItems), digitalDelivery: cartIsAllAutoDeliver(trustedItems) },
    );

    const { getShippingSettings } = await import("@/lib/shipping-settings");
    const settings = await getShippingSettings();

    return NextResponse.json({
      quote,
      freeShippingThreshold: settings.freeShippingThreshold,
      addressIncomplete: false,
      couponError: null,
      items: trustedItems.map((i) => ({
        productId: i.productId,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  } catch (err) {
    console.error("Pricing quote error:", err);
    return NextResponse.json({ error: "Failed to calculate pricing" }, { status: 500 });
  }
}
