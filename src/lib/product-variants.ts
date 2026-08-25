import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type VariantFormInput = {
  id?: string;
  sku: string;
  nameEn: string;
  nameZh: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  active: boolean;
  isDefault: boolean;
  sortOrder: number;
};

export type VariantPublic = {
  id: string;
  sku: string;
  nameEn: string;
  nameZh: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  active: boolean;
  isDefault: boolean;
  sortOrder: number;
};

type TxClient = Prisma.TransactionClient;

export function cartLineKey(productId: string, variantId?: string | null) {
  return variantId ? `${productId}:${variantId}` : productId;
}

export function parseVariantsJson(raw: string): VariantFormInput[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row, index) => {
      const r = row as Record<string, unknown>;
      const compareRaw = r.compareAtPrice;
      let compareAtPrice: number | null = null;
      if (compareRaw !== null && compareRaw !== undefined && compareRaw !== "") {
        const n = Number(compareRaw);
        if (Number.isFinite(n) && n > 0) compareAtPrice = n;
      }
      return {
        id: typeof r.id === "string" && r.id ? r.id : undefined,
        sku: String(r.sku ?? "").trim(),
        nameEn: String(r.nameEn ?? "").trim(),
        nameZh: String(r.nameZh ?? "").trim(),
        price: Number(r.price ?? 0),
        compareAtPrice,
        stock: Math.floor(Number(r.stock ?? 0)),
        active: r.active !== false,
        isDefault: Boolean(r.isDefault),
        sortOrder: Number.isFinite(Number(r.sortOrder))
          ? Number(r.sortOrder)
          : index,
      };
    });
  } catch {
    return [];
  }
}

/** Build a single default variant from product-level fields when none submitted. */
export function defaultVariantFromProduct(fields: {
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}): VariantFormInput {
  return {
    sku: fields.sku || "DEFAULT",
    nameEn: "",
    nameZh: "",
    price: fields.price,
    compareAtPrice: fields.compareAtPrice,
    stock: fields.stock,
    active: true,
    isDefault: true,
    sortOrder: 0,
  };
}

export function validateVariants(variants: VariantFormInput[]): string[] {
  const errors: string[] = [];
  if (variants.length === 0) {
    errors.push("至少需要一个规格");
    return errors;
  }

  const skus = new Set<string>();
  let defaultCount = 0;

  for (const [i, v] of variants.entries()) {
    const label = `规格 #${i + 1}`;
    if (!v.sku) errors.push(`${label}：SKU 不能为空`);
    if (v.sku && skus.has(v.sku.toLowerCase())) {
      errors.push(`${label}：SKU「${v.sku}」重复`);
    }
    if (v.sku) skus.add(v.sku.toLowerCase());
    if (!Number.isFinite(v.price) || v.price <= 0) {
      errors.push(`${label}：售价必须大于 0`);
    }
    if (
      v.compareAtPrice != null &&
      (!Number.isFinite(v.compareAtPrice) || v.compareAtPrice <= v.price)
    ) {
      errors.push(`${label}：划线价须大于售价`);
    }
    if (!Number.isFinite(v.stock) || v.stock < 0) {
      errors.push(`${label}：库存不能为负数`);
    }
    if (v.isDefault) defaultCount += 1;
  }

  if (defaultCount === 0) {
    variants[0].isDefault = true;
  } else if (defaultCount > 1) {
    let seen = false;
    for (const v of variants) {
      if (v.isDefault) {
        if (seen) v.isDefault = false;
        else seen = true;
      }
    }
  }

  return errors;
}

export function mirrorsFromVariants(variants: VariantFormInput[]) {
  const active = variants.filter((v) => v.active);
  const pool = active.length > 0 ? active : variants;
  const def = pool.find((v) => v.isDefault) ?? pool[0];
  return {
    sku: def.sku,
    price: def.price,
    compareAtPrice: def.compareAtPrice,
    stock: pool.reduce((sum, v) => sum + Math.max(0, v.stock), 0),
  };
}

export async function replaceProductVariants(
  productId: string,
  variants: VariantFormInput[],
  db: TxClient | typeof prisma = prisma,
) {
  const existing = await db.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  const keepIds = new Set(
    variants.map((v) => v.id).filter((id): id is string => Boolean(id)),
  );
  const toDelete = existing.filter((row) => !keepIds.has(row.id)).map((r) => r.id);
  if (toDelete.length > 0) {
    await db.productVariant.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (const [index, v] of variants.entries()) {
    const data = {
      sku: v.sku,
      nameEn: v.nameEn,
      nameZh: v.nameZh,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      active: v.active,
      isDefault: v.isDefault,
      sortOrder: v.sortOrder ?? index,
    };
    if (v.id && keepIds.has(v.id)) {
      await db.productVariant.update({ where: { id: v.id }, data });
    } else {
      await db.productVariant.create({
        data: { productId, ...data },
      });
    }
  }

  const mirrors = mirrorsFromVariants(variants);
  await db.product.update({
    where: { id: productId },
    data: mirrors,
  });
}

/** Ensure legacy products without variants get one default row. */
export async function ensureDefaultVariant(
  productId: string,
  db: TxClient | typeof prisma = prisma,
) {
  const count = await db.productVariant.count({ where: { productId } });
  if (count > 0) return;

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return;

  await db.productVariant.create({
    data: {
      productId,
      sku: product.sku || `SKU-${productId.slice(-6)}`,
      nameEn: "",
      nameZh: "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      active: true,
      isDefault: true,
      sortOrder: 0,
    },
  });
}

export async function backfillMissingVariants() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      _count: { select: { variants: true } },
    },
  });

  for (const p of products) {
    if (p._count.variants > 0) continue;
    await prisma.productVariant.create({
      data: {
        productId: p.id,
        sku: p.sku || `SKU-${p.id.slice(-6)}`,
        nameEn: "",
        nameZh: "",
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        active: true,
        isDefault: true,
        sortOrder: 0,
      },
    });
  }
}

export function toPublicVariants(
  rows: {
    id: string;
    sku: string;
    nameEn: string;
    nameZh: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    active: boolean;
    isDefault: boolean;
    sortOrder: number;
  }[],
): VariantPublic[] {
  return rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.sku.localeCompare(b.sku))
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      nameEn: v.nameEn,
      nameZh: v.nameZh,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      active: v.active,
      isDefault: v.isDefault,
      sortOrder: v.sortOrder,
    }));
}
