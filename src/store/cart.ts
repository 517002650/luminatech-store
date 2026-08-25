"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartLineKey } from "@/lib/product-variants";

export type CartItem = {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantNameEn?: string;
  variantNameZh?: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

function sameLine(a: CartItem, productId: string, variantId?: string) {
  return cartLineKey(a.productId, a.variantId) === cartLineKey(productId, variantId);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) =>
            sameLine(i, item.productId, item.variantId),
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, item.productId, item.variantId)
                  ? {
                      ...i,
                      ...item,
                      quantity: i.quantity + quantity,
                    }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },
      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !sameLine(i, productId, variantId),
          ),
        }));
      },
      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            sameLine(i, productId, variantId) ? { ...i, quantity } : i,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "cart-storage" },
  ),
);
