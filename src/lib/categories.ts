/** Standard storefront product categories (slug → localized labels). */

export type ProductCategoryKey =
  | "consoles"
  | "lasers"
  | "fixtures"
  | "effects"
  | "accessories";

export type ProductCategory = {
  key: ProductCategoryKey;
  en: string;
  zh: string;
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { key: "consoles", en: "Lighting Consoles", zh: "灯光控制台" },
  { key: "lasers", en: "Laser Systems", zh: "激光灯" },
  { key: "fixtures", en: "Stage Fixtures", zh: "舞台灯具" },
  { key: "effects", en: "Effects", zh: "特效设备" },
  { key: "accessories", en: "Control & Accessories", zh: "控制与配件" },
];

const EN_TO_KEY: Record<string, ProductCategoryKey> = {
  "Lighting Consoles": "consoles",
  "Laser Systems": "lasers",
  "Stage Fixtures": "fixtures",
  Effects: "effects",
  "Control & Accessories": "accessories",
};

const SLUG_OVERRIDES: Record<string, ProductCategoryKey> = {
  "grandma3-processing-unit-l": "accessories",
  "grandma3-onpc-4port-node-4k": "accessories",
  "chauvet-strike-4": "effects",
};

export function getCategoryByKey(key: string): ProductCategory {
  const found = PRODUCT_CATEGORIES.find((c) => c.key === key);
  return found ?? PRODUCT_CATEGORIES[2];
}

export function resolveCategoryKey(input: {
  categoryKey?: string | null;
  categoryEn?: string | null;
  slug?: string | null;
}): ProductCategoryKey {
  // Explicit categoryKey (e.g. admin form) always wins.
  if (input.categoryKey && PRODUCT_CATEGORIES.some((c) => c.key === input.categoryKey)) {
    return input.categoryKey as ProductCategoryKey;
  }
  if (input.slug && SLUG_OVERRIDES[input.slug]) {
    return SLUG_OVERRIDES[input.slug];
  }
  if (input.categoryEn && EN_TO_KEY[input.categoryEn]) {
    return EN_TO_KEY[input.categoryEn];
  }
  return "fixtures";
}

export function categoryLabels(key: ProductCategoryKey, locale: "en" | "zh") {
  const cat = getCategoryByKey(key);
  return locale === "zh" ? cat.zh : cat.en;
}

export function isValidCategoryKey(value: string | undefined | null): value is ProductCategoryKey {
  return Boolean(value && PRODUCT_CATEGORIES.some((c) => c.key === value));
}
