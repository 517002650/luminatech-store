"use client";

import { useCartStore } from "@/store/cart";

export function CartBadge() {
  const totalItems = useCartStore((s) => s.totalItems());

  if (totalItems === 0) return null;

  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[11px] font-bold text-zinc-50 ring-1 ring-zinc-950/20">
      {totalItems}
    </span>
  );
}
