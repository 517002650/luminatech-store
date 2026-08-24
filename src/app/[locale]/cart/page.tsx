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
      <h1 className="text-3xl font-bold text-zinc-50">{t("title")}</h1>
      <div className="mt-8">
        <CartItemList />
      </div>
      {items.length > 0 && (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex justify-between text-xl font-bold text-zinc-100">
            <span>{t("subtotal")}</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <Link
            href="/checkout"
            className="btn-primary mt-6 block w-full py-3 text-center"
          >
            {t("checkout")}
          </Link>
        </div>
      )}
    </div>
  );
}
