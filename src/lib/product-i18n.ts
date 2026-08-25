import type { Product } from "@prisma/client";
import type { Locale } from "@/i18n/routing";

export type ProductSpec = {
  label: string;
  value: string;
};

export type LocalizedProduct = Product & {
  name: string;
  shortDesc: string;
  description: string;
  category: string;
  specs: ProductSpec[];
  highlights: string[];
  gallery: string[];
};

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function localizeProduct(product: Product, locale: Locale): LocalizedProduct {
  const isZh = locale === "zh";

  return {
    ...product,
    name: isZh ? product.nameZh : product.nameEn,
    shortDesc: isZh ? product.shortDescZh : product.shortDescEn,
    description: isZh ? product.descriptionZh : product.descriptionEn,
    category: isZh ? product.categoryZh : product.categoryEn,
    specs: parseJson<ProductSpec[]>(isZh ? product.specsZh : product.specsEn, []),
    highlights: parseJson<string[]>(
      isZh ? product.highlightsZh : product.highlightsEn,
      [],
    ),
    gallery: parseJson<string[]>(product.images, [product.image]),
  };
}

export function getCartItemName(
  item: {
    nameEn: string;
    nameZh: string;
    variantNameEn?: string;
    variantNameZh?: string;
    variantSku?: string;
  },
  locale: Locale,
) {
  const base = locale === "zh" ? item.nameZh : item.nameEn;
  const option =
    locale === "zh"
      ? item.variantNameZh || item.variantNameEn || item.variantSku
      : item.variantNameEn || item.variantNameZh || item.variantSku;
  return option ? `${base} (${option})` : base;
}
