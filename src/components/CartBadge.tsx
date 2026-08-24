"use client";

import { useCartStore } from "@/store/cart";

export function CartBadge() {
  const totalItems = useCartStore((s) => s.totalItems());

  if (totalItems === 0) return null;

  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
      {totalItems}
    </span>
  );
}
