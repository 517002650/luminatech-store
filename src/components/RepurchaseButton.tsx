"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useCartStore } from "@/store/cart";
import type { OrderItem } from "@/lib/orders";

export function RepurchaseButton({ items }: { items: OrderItem[] }) {
  const t = useTranslations("account");
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  function handleRepurchase() {
    for (const item of items) {
      addItem(
        {
          productId: item.productId,
          slug: item.slug,
          nameEn: item.nameEn,
          nameZh: item.nameZh,
          price: item.price,
          image: item.image,
        },
        item.quantity,
      );
    }
    router.push("/cart");
  }

  if (items.length === 0) return null;

  return (
    <button
      type="button"
      onClick={handleRepurchase}
      className="rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:from-cyan-500 hover:to-violet-500"
    >
      {t("repurchase")}
    </button>
  );
}
