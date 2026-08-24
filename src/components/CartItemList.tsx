"use client";

import { SafeImage } from "@/components/SafeImage";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getCartItemName } from "@/lib/product-i18n";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/store/cart";

export function CartItemList() {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const { items, updateQuantity, removeItem } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
        <p className="text-lg text-stone-600">{t("empty")}</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
        >
          {t("browse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const name = getCartItemName(item, locale);
        return (
          <div
            key={item.productId}
            className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
              <SafeImage src={item.image} alt={name} fill className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link
                  href={`/products/${item.slug}`}
                  className="font-semibold text-stone-900 hover:underline"
                >
                  {name}
                </Link>
                <p className="text-stone-500">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="rounded-lg border border-stone-200 p-1.5 hover:bg-stone-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="rounded-lg border border-stone-200 p-1.5 hover:bg-stone-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
