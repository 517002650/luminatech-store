import type { Prisma } from "@prisma/client";

export function normalizeSearchQuery(q: string | undefined | null) {
  return (q ?? "").trim().slice(0, 100);
}

/** Storefront catalog always excludes unpublished products. */
export function buildProductSearchWhere(
  query: string,
  categoryKey?: string | null,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { active: true };
  if (categoryKey) where.categoryKey = categoryKey;

  const q = normalizeSearchQuery(query);
  if (!q) return where;

  return {
    ...where,
    OR: [
      { nameEn: { contains: q, mode: "insensitive" } },
      { nameZh: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { shortDescEn: { contains: q, mode: "insensitive" } },
      { shortDescZh: { contains: q, mode: "insensitive" } },
      { categoryEn: { contains: q, mode: "insensitive" } },
      { categoryZh: { contains: q, mode: "insensitive" } },
    ],
  };
}

export function buildProductsHref(category?: string | null, query?: string | null) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const q = normalizeSearchQuery(query);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}
