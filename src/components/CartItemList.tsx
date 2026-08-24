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
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center">
        <p className="text-lg text-zinc-400">{t("empty")}</p>
        <Link href="/products" className="btn-primary mt-4 inline-block">
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
            className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
              <SafeImage src={item.image} alt={name} fill className="object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.slug}`}
                className="font-semibold text-zinc-100 hover:text-cyan-400"
              >
                {name}
              </Link>
              <p className="mt-1 text-sm text-zinc-500">{formatPrice(item.price)}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t("quantity")}
                </span>
                <div className="inline-flex items-center overflow-hidden rounded-xl border border-zinc-600 bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label={t("decrease")}
                    className="flex h-10 w-10 items-center justify-center text-zinc-200 transition hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-10 min-w-12 items-center justify-center border-x border-zinc-600 px-3 text-base font-semibold text-zinc-50">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label={t("increase")}
                    className="flex h-10 w-10 items-center justify-center text-zinc-200 transition hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
              <span className="text-lg font-bold text-zinc-50">
                {formatPrice(item.price * item.quantity)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                {t("remove")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
