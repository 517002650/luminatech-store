import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { localizeProduct } from "@/lib/product-i18n";
import { getProductRatingMap } from "@/lib/reviews";
import { ProductCard } from "@/components/ProductCard";
import { ProductCategoryNav } from "@/components/ProductCategoryNav";
import {
  categoryLabels,
  isValidCategoryKey,
  type ProductCategoryKey,
} from "@/lib/categories";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category } = await searchParams;
  const t = await getTranslations({ locale, namespace: "products" });

  if (isValidCategoryKey(category)) {
    return { title: `${categoryLabels(category, locale)} | ${t("title")}` };
  }
  return { title: t("title") };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category: categoryParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("products");

  const activeCategory = isValidCategoryKey(categoryParam) ? categoryParam : null;

  const [products, categoryGroups] = await Promise.all([
    prisma.product.findMany({
      where: activeCategory ? { categoryKey: activeCategory } : undefined,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.groupBy({
      by: ["categoryKey"],
      _count: { _all: true },
    }),
  ]);

  const localized = products.map((p) => localizeProduct(p, locale));
  const ratingMap = await getProductRatingMap(products.map((p) => p.id));

  const counts = Object.fromEntries(
    categoryGroups.map((g) => [g.categoryKey, g._count._all]),
  ) as Partial<Record<ProductCategoryKey, number>>;

  const pageTitle = activeCategory
    ? categoryLabels(activeCategory, locale)
    : t("title");

  return (
    <>
      <ProductCategoryNav active={activeCategory} counts={counts} />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-zinc-50">{pageTitle}</h1>
        <p className="mt-2 text-zinc-500">
          {activeCategory
            ? t("categoryCount", { count: localized.length })
            : t("count", { count: localized.length })}
        </p>

        {localized.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center text-zinc-500">
            {t("emptyCategory")}
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {localized.map((product) => {
              const rating = ratingMap.get(product.id);
              return (
                <ProductCard
                  key={product.id}
                  slug={product.slug}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  category={product.category}
                  avgRating={rating?.avg}
                  reviewCount={rating?.count}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
