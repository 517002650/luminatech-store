import { prisma } from "@/lib/db";

export type ProductCategory = {
  key: string;
  en: string;
  zh: string;
  sortOrder?: number;
  active?: boolean;
  id?: string;
};

/** Built-in categories seeded into DB on first use. */
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  { key: "consoles", en: "Lighting Consoles", zh: "灯光控制台", sortOrder: 10 },
  { key: "lasers", en: "Laser Systems", zh: "激光灯", sortOrder: 20 },
  { key: "fixtures", en: "Stage Fixtures", zh: "舞台灯具", sortOrder: 30 },
  { key: "effects", en: "Effects", zh: "特效设备", sortOrder: 40 },
  { key: "accessories", en: "Control & Accessories", zh: "控制与配件", sortOrder: 50 },
];

/** @deprecated Prefer listCategories(); kept for sync fallbacks. */
export const PRODUCT_CATEGORIES = DEFAULT_CATEGORIES;

const EN_TO_KEY: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.en, c.key]),
);

const SLUG_OVERRIDES: Record<string, string> = {
  "grandma3-processing-unit-l": "accessories",
  "grandma3-onpc-4port-node-4k": "accessories",
  "chauvet-strike-4": "effects",
};

export function slugifyCategoryKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function ensureDefaultCategories() {
  const count = await prisma.category.count();
  if (count > 0) return;

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      key: c.key,
      nameEn: c.en,
      nameZh: c.zh,
      sortOrder: c.sortOrder ?? 0,
      active: true,
    })),
  });
}

export async function listCategories(options?: {
  activeOnly?: boolean;
}): Promise<ProductCategory[]> {
  await ensureDefaultCategories();

  const rows = await prisma.category.findMany({
    where: options?.activeOnly ? { active: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    en: r.nameEn,
    zh: r.nameZh,
    sortOrder: r.sortOrder,
    active: r.active,
  }));
}

export async function getCategoryByKey(
  key: string,
): Promise<ProductCategory | null> {
  await ensureDefaultCategories();
  const row = await prisma.category.findUnique({ where: { key } });
  if (!row) {
    return DEFAULT_CATEGORIES.find((c) => c.key === key) ?? null;
  }
  return {
    id: row.id,
    key: row.key,
    en: row.nameEn,
    zh: row.nameZh,
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

/** Sync helper when category list is already loaded. */
export function findCategoryInList(
  categories: ProductCategory[],
  key: string,
): ProductCategory {
  return categories.find((c) => c.key === key) ?? categories[0] ?? DEFAULT_CATEGORIES[2];
}

export function resolveCategoryKey(
  input: {
    categoryKey?: string | null;
    categoryEn?: string | null;
    slug?: string | null;
  },
  knownKeys?: string[],
): string {
  if (input.categoryKey) {
    if (!knownKeys || knownKeys.includes(input.categoryKey)) {
      return input.categoryKey;
    }
  }
  if (input.slug && SLUG_OVERRIDES[input.slug]) {
    return SLUG_OVERRIDES[input.slug];
  }
  if (input.categoryEn && EN_TO_KEY[input.categoryEn]) {
    return EN_TO_KEY[input.categoryEn];
  }
  return "fixtures";
}

export function categoryLabels(
  category: ProductCategory | string,
  locale: "en" | "zh",
  categories?: ProductCategory[],
) {
  if (typeof category !== "string") {
    return locale === "zh" ? category.zh : category.en;
  }
  const found =
    categories?.find((c) => c.key === category) ??
    DEFAULT_CATEGORIES.find((c) => c.key === category);
  if (!found) return category;
  return locale === "zh" ? found.zh : found.en;
}

export function isValidCategoryKey(
  value: string | undefined | null,
  knownKeys?: string[],
): value is string {
  if (!value) return false;
  if (knownKeys) return knownKeys.includes(value);
  return true;
}

/** @deprecated Use string category keys from DB. */
export type ProductCategoryKey = string;
