"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CartItemList } from "@/components/CartItemList";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cart";

export default function CartPage() {
  const t = useTranslations("cart");
  const totalPrice = useCartStore((s) => s.totalPrice());
  const items = useCartStore((s) => s.items);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-stone-900">{t("title")}</h1>
      <div className="mt-8">
        <CartItemList />
      </div>
      {items.length > 0 && (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex justify-between text-xl font-bold">
            <span>{t("subtotal")}</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block w-full rounded-xl bg-stone-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            {t("checkout")}
          </Link>
        </div>
      )}
    </div>
  );
}
