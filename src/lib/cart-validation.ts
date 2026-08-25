import { prisma } from "@/lib/db";
import type { OrderItem } from "@/lib/orders";

export type CartRequestItem = {
  productId: string;
  quantity: number;
};

export type ValidatedCartItem = OrderItem & {
  name: string;
  stock: number;
};

export class CartValidationError extends Error {
  constructor(
    message: string,
    public code: "empty" | "not_found" | "out_of_stock" | "invalid_qty",
  ) {
    super(message);
    this.name = "CartValidationError";
  }
}

/**
 * Resolve cart lines from the database. Never trust client prices.
 */
export async function resolveCartItemsFromDb(
  rawItems: CartRequestItem[],
  locale: "en" | "zh" = "en",
): Promise<ValidatedCartItem[]> {
  if (!rawItems?.length) {
    throw new CartValidationError("Cart is empty", "empty");
  }

  const quantities = new Map<string, number>();
  for (const item of rawItems) {
    const id = String(item.productId ?? "").trim();
    const qty = Math.floor(Number(item.quantity));
    if (!id || !Number.isFinite(qty) || qty < 1) {
      throw new CartValidationError("Invalid cart quantity", "invalid_qty");
    }
    quantities.set(id, (quantities.get(id) ?? 0) + qty);
  }

  const ids = [...quantities.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });

  if (products.length !== ids.length) {
    throw new CartValidationError("One or more products are unavailable", "not_found");
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const resolved: ValidatedCartItem[] = [];

  for (const id of ids) {
    const product = byId.get(id)!;
    const quantity = quantities.get(id)!;

    if (product.stock < quantity) {
      const name = locale === "zh" ? product.nameZh : product.nameEn;
      throw new CartValidationError(
        `Insufficient stock for “${name}” (available: ${product.stock})`,
        "out_of_stock",
      );
    }

    resolved.push({
      productId: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameZh: product.nameZh,
      name: locale === "zh" ? product.nameZh : product.nameEn,
      price: product.price,
      quantity,
      image: product.image,
      stock: product.stock,
    });
  }

  return resolved;
}

/** Decrement stock only when enough units remain. Returns false if any line failed. */
export async function decrementStockForItems(
  items: Pick<OrderItem, "productId" | "quantity">[],
): Promise<boolean> {
  for (const item of items) {
    if (!item.productId || item.productId === "unknown") continue;
    const result = await prisma.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (result.count === 0) return false;
  }
  return true;
}

export async function restockItems(
  items: Pick<OrderItem, "productId" | "quantity">[],
): Promise<void> {
  for (const item of items) {
    if (!item.productId || item.productId === "unknown") continue;
    if (item.quantity < 1) continue;
    await prisma.product.updateMany({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}
