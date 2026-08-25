import type { ProductSpec } from "@/lib/product-i18n";
import { getCategoryByKey, resolveCategoryKey } from "@/lib/categories";
import {
  defaultVariantFromProduct,
  mirrorsFromVariants,
  parseVariantsJson,
  validateVariants,
  type VariantFormInput,
} from "@/lib/product-variants";

export type ProductFormInput = {
  slug: string;
  sku: string;
  brand: string;
  nameEn: string;
  nameZh: string;
  shortDescEn: string;
  shortDescZh: string;
  descriptionEn: string;
  descriptionZh: string;
  categoryKey: string;
  categoryEn: string;
  categoryZh: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  galleryText: string;
  specsEnText: string;
  specsZhText: string;
  highlightsEnText: string;
  highlightsZhText: string;
  stock: number;
  featured: boolean;
  requiresFreight: boolean;
  /** Instant digital delivery after payment (default false). */
  autoDeliver: boolean;
  hsCode: string;
  originCountry: string;
  customsDescEn: string;
  weightGrams: number;
  active: boolean;
  warranty: string;
  variants: VariantFormInput[];
};

function linesToList(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function textToSpecs(text: string): ProductSpec[] {
  return linesToList(text)
    .map((line) => {
      const pipeIndex = line.indexOf("|");
      if (pipeIndex === -1) {
        return { label: line, value: "" };
      }
      return {
        label: line.slice(0, pipeIndex).trim(),
        value: line.slice(pipeIndex + 1).trim(),
      };
    })
    .filter((spec) => spec.label);
}

export function specsToText(specs: ProductSpec[]) {
  return specs.map((spec) => `${spec.label} | ${spec.value}`).join("\n");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formDataToProductInput(formData: FormData): ProductFormInput {
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();

  const categoryKey = resolveCategoryKey({
    categoryKey: String(formData.get("categoryKey") ?? "").trim(),
    categoryEn: String(formData.get("categoryEn") ?? "").trim(),
    slug: slugInput || slugify(nameEn),
  });

  const sku = String(formData.get("sku") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const compareAtPrice = (() => {
    const raw = String(formData.get("compareAtPrice") ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const stock = Number(formData.get("stock") ?? 0);

  let variants = parseVariantsJson(String(formData.get("variantsJson") ?? ""));
  if (variants.length === 0) {
    variants = [
      defaultVariantFromProduct({ sku, price, compareAtPrice, stock }),
    ];
  }

  const mirrors = mirrorsFromVariants(variants);

  // Mutual exclusion: freight quote vs instant digital delivery
  let requiresFreight = formData.get("requiresFreight") === "on";
  let autoDeliver = formData.get("autoDeliver") === "on";
  if (autoDeliver) requiresFreight = false;
  if (requiresFreight) autoDeliver = false;

  return {
    slug: slugInput || slugify(nameEn),
    sku: mirrors.sku,
    brand: String(formData.get("brand") ?? "").trim(),
    nameEn,
    nameZh: String(formData.get("nameZh") ?? "").trim(),
    shortDescEn: String(formData.get("shortDescEn") ?? "").trim(),
    shortDescZh: String(formData.get("shortDescZh") ?? "").trim(),
    descriptionEn: String(formData.get("descriptionEn") ?? "").trim(),
    descriptionZh: String(formData.get("descriptionZh") ?? "").trim(),
    categoryKey,
    categoryEn: "",
    categoryZh: "",
    price: mirrors.price,
    compareAtPrice: mirrors.compareAtPrice,
    image: String(formData.get("image") ?? "").trim(),
    galleryText: String(formData.get("galleryText") ?? ""),
    specsEnText: String(formData.get("specsEnText") ?? ""),
    specsZhText: String(formData.get("specsZhText") ?? ""),
    highlightsEnText: String(formData.get("highlightsEnText") ?? ""),
    highlightsZhText: String(formData.get("highlightsZhText") ?? ""),
    stock: mirrors.stock,
    featured: formData.get("featured") === "on",
    requiresFreight,
    autoDeliver,
    hsCode: String(formData.get("hsCode") ?? "").trim().slice(0, 32),
    originCountry: String(formData.get("originCountry") ?? "CN")
      .trim()
      .toUpperCase()
      .slice(0, 8) || "CN",
    customsDescEn: String(formData.get("customsDescEn") ?? "").trim().slice(0, 120),
    weightGrams: (() => {
      const n = Math.floor(Number(formData.get("weightGrams") ?? 0));
      return Number.isFinite(n) && n > 0 ? n : 0;
    })(),
    active: formData.get("active") === "on",
    warranty: String(formData.get("warranty") ?? "").trim(),
    variants,
  };
}

export async function applyCategoryLabels(
  input: ProductFormInput,
): Promise<ProductFormInput | { error: string }> {
  const category = await getCategoryByKey(input.categoryKey);
  if (!category) {
    return { error: "请选择有效的商品分类" };
  }
  return {
    ...input,
    categoryKey: category.key,
    categoryEn: category.en,
    categoryZh: category.zh,
  };
}

export function productInputToDbData(input: ProductFormInput) {
  const gallery = linesToList(input.galleryText);
  const images = gallery.length > 0 ? gallery : input.image ? [input.image] : [];

  return {
    slug: input.slug,
    sku: input.sku,
    brand: input.brand,
    nameEn: input.nameEn,
    nameZh: input.nameZh,
    shortDescEn: input.shortDescEn,
    shortDescZh: input.shortDescZh,
    descriptionEn: input.descriptionEn,
    descriptionZh: input.descriptionZh,
    categoryKey: input.categoryKey,
    categoryEn: input.categoryEn,
    categoryZh: input.categoryZh,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    image: input.image,
    images: JSON.stringify(images),
    specsEn: JSON.stringify(textToSpecs(input.specsEnText)),
    specsZh: JSON.stringify(textToSpecs(input.specsZhText)),
    highlightsEn: JSON.stringify(linesToList(input.highlightsEnText)),
    highlightsZh: JSON.stringify(linesToList(input.highlightsZhText)),
    stock: input.stock,
    featured: input.featured,
    requiresFreight: input.requiresFreight,
    autoDeliver: input.autoDeliver,
    hsCode: input.hsCode,
    originCountry: input.originCountry,
    customsDescEn: input.customsDescEn,
    weightGrams: input.weightGrams,
    active: input.active,
    warranty: input.warranty,
  };
}

export function validateProductInput(input: ProductFormInput) {
  const errors: string[] = [];

  if (!input.nameEn) errors.push("英文名称不能为空");
  if (!input.nameZh) errors.push("中文名称不能为空");
  if (!input.slug) errors.push("Slug 不能为空");
  if (!input.brand) errors.push("品牌不能为空");
  if (!input.image) errors.push("主图 URL 不能为空");
  errors.push(...validateVariants(input.variants));

  return errors;
}
