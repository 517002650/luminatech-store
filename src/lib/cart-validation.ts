import { prisma } from "@/lib/db";
import type { OrderItem } from "@/lib/orders";
import { ensureDefaultVariant } from "@/lib/product-variants";
import type { Prisma } from "@prisma/client";

export type CartRequestItem = {
  productId: string;
  quantity: number;
  variantId?: string;
  /** Used to recover after DB restore / reseed when productId is stale */
  slug?: string;
  variantSku?: string;
};

export type ValidatedCartItem = OrderItem & {
  name: string;
  stock: number;
  requiresFreight: boolean;
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

export class StockDecrementError extends Error {
  constructor(public productId: string, public variantId?: string) {
    super(
      `Insufficient stock for product ${productId}${variantId ? ` variant ${variantId}` : ""}`,
    );
    this.name = "StockDecrementError";
  }
}

type TxClient = Prisma.TransactionClient;

type LineKey = string;

function lineKey(productId: string, variantId?: string) {
  return variantId ? `${productId}:${variantId}` : productId;
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

  const quantities = new Map<
    LineKey,
    {
      productId: string;
      variantId?: string;
      quantity: number;
      slug?: string;
      variantSku?: string;
    }
  >();
  for (const item of rawItems) {
    const productId = String(item.productId ?? "").trim();
    const variantId = String(item.variantId ?? "").trim() || undefined;
    const slug = String(item.slug ?? "").trim() || undefined;
    const variantSku = String(item.variantSku ?? "").trim() || undefined;
    const qty = Math.floor(Number(item.quantity));
    if (!productId || !Number.isFinite(qty) || qty < 1) {
      throw new CartValidationError("Invalid cart quantity", "invalid_qty");
    }
    const key = lineKey(productId, variantId);
    const prev = quantities.get(key);
    quantities.set(key, {
      productId,
      variantId,
      slug: slug ?? prev?.slug,
      variantSku: variantSku ?? prev?.variantSku,
      quantity: (prev?.quantity ?? 0) + qty,
    });
  }

  const productIds = [...new Set([...quantities.values()].map((q) => q.productId))];
  for (const id of productIds) {
    await ensureDefaultVariant(id);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const missing = [...quantities.values()].filter((q) => !byId.has(q.productId));
  if (missing.length > 0) {
    const slugs = [
      ...new Set(missing.map((m) => m.slug).filter((s): s is string => Boolean(s))),
    ];
    if (slugs.length > 0) {
      const bySlugRows = await prisma.product.findMany({
        where: { slug: { in: slugs } },
        include: { variants: true },
      });
      const bySlug = new Map(bySlugRows.map((p) => [p.slug, p]));
      for (const line of missing) {
        const recovered = line.slug ? bySlug.get(line.slug) : undefined;
        if (recovered) {
          byId.set(line.productId, recovered);
          await ensureDefaultVariant(recovered.id);
          const fresh = await prisma.product.findUnique({
            where: { id: recovered.id },
            include: { variants: true },
          });
          if (fresh) byId.set(line.productId, fresh);
        }
      }
    }
  }

  if ([...quantities.values()].some((q) => !byId.has(q.productId))) {
    throw new CartValidationError("One or more products are unavailable", "not_found");
  }

  const resolved: ValidatedCartItem[] = [];

  for (const { productId, variantId, quantity, variantSku } of quantities.values()) {
    const product = byId.get(productId)!;

    if (!product.active) {
      const name = locale === "zh" ? product.nameZh : product.nameEn;
      throw new CartValidationError(
        `“${name}” is no longer available`,
        "not_found",
      );
    }

    const activeVariants = product.variants.filter((v) => v.active);
    let variant =
      (variantId
        ? product.variants.find((v) => v.id === variantId)
        : null) ??
      (variantSku
        ? activeVariants.find((v) => v.sku === variantSku) ??
          product.variants.find((v) => v.sku === variantSku)
        : null) ??
      activeVariants.find((v) => v.isDefault) ??
      activeVariants[0] ??
      product.variants[0];

    if (!variant || !variant.active) {
      const name = locale === "zh" ? product.nameZh : product.nameEn;
      throw new CartValidationError(
        `Selected option for “${name}” is unavailable`,
        "not_found",
      );
    }

    if (variant.stock < quantity) {
      const name = locale === "zh" ? product.nameZh : product.nameEn;
      const option =
        locale === "zh"
          ? variant.nameZh || variant.sku
          : variant.nameEn || variant.sku;
      throw new CartValidationError(
        `Insufficient stock for “${name}${option ? ` (${option})` : ""}” (available: ${variant.stock})`,
        "out_of_stock",
      );
    }

    resolved.push({
      productId: product.id,
      variantId: variant.id,
      variantSku: variant.sku,
      variantNameEn: variant.nameEn,
      variantNameZh: variant.nameZh,
      slug: product.slug,
      nameEn: product.nameEn,
      nameZh: product.nameZh,
      name: locale === "zh" ? product.nameZh : product.nameEn,
      price: variant.price,
      quantity,
      image: product.image,
      stock: variant.stock,
      requiresFreight: product.requiresFreight,
    });
  }

  return resolved;
}

export function cartRequiresFreightQuote(items: { requiresFreight?: boolean }[]) {
  return items.some((item) => item.requiresFreight);
}

async function syncProductStockMirror(
  productId: string,
  db: TxClient | typeof prisma,
) {
  const variants = await db.productVariant.findMany({
    where: { productId, active: true },
    select: { stock: true },
  });
  const stock = variants.reduce((sum, v) => sum + v.stock, 0);
  await db.product.update({
    where: { id: productId },
    data: { stock },
  });
}

/**
 * Decrement stock only when enough units remain.
 * Pass a transaction client for atomic checkout fulfillment.
 */
export async function decrementStockForItems(
  items: Pick<OrderItem, "productId" | "variantId" | "quantity">[],
  db: TxClient | typeof prisma = prisma,
): Promise<boolean> {
  const touched = new Set<string>();
  for (const item of items) {
    if (!item.productId || item.productId === "unknown") continue;
    if (item.variantId) {
      const result = await db.productVariant.updateMany({
        where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) return false;
      touched.add(item.productId);
    } else {
      await ensureDefaultVariant(item.productId, db);
      const def = await db.productVariant.findFirst({
        where: { productId: item.productId, isDefault: true },
      });
      if (def) {
        const result = await db.productVariant.updateMany({
          where: { id: def.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) return false;
        touched.add(item.productId);
      } else {
        const result = await db.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) return false;
      }
    }
  }
  for (const productId of touched) {
    await syncProductStockMirror(productId, db);
  }
  return true;
}

/** Like decrementStockForItems but throws StockDecrementError on failure. */
export async function decrementStockForItemsOrThrow(
  items: Pick<OrderItem, "productId" | "variantId" | "quantity">[],
  db: TxClient | typeof prisma = prisma,
) {
  const ok = await decrementStockForItems(items, db);
  if (!ok) {
    const first = items.find((i) => i.productId && i.productId !== "unknown");
    throw new StockDecrementError(first?.productId ?? "unknown", first?.variantId);
  }
}

export async function restockItems(
  items: Pick<OrderItem, "productId" | "variantId" | "quantity">[],
  db: TxClient | typeof prisma = prisma,
): Promise<void> {
  const touched = new Set<string>();
  for (const item of items) {
    if (!item.productId || item.productId === "unknown") continue;
    if (item.quantity < 1) continue;
    if (item.variantId) {
      await db.productVariant.updateMany({
        where: { id: item.variantId, productId: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      touched.add(item.productId);
    } else {
      const def = await db.productVariant.findFirst({
        where: { productId: item.productId, isDefault: true },
      });
      if (def) {
        await db.productVariant.updateMany({
          where: { id: def.id },
          data: { stock: { increment: item.quantity } },
        });
        touched.add(item.productId);
      } else {
        await db.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  }
  for (const productId of touched) {
    await syncProductStockMirror(productId, db);
  }
}
