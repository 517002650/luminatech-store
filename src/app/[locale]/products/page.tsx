import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { localizeProduct } from "@/lib/product-i18n";
import { getProductRatingMap } from "@/lib/reviews";
import { ProductCard } from "@/components/ProductCard";
import { ProductCategoryNav } from "@/components/ProductCategoryNav";
import { ClearSearchLink, SearchBar } from "@/components/SearchBar";
import {
  categoryLabels,
  isValidCategoryKey,
  listCategories,
} from "@/lib/categories";
import {
  buildProductSearchWhere,
  buildProductsHref,
  normalizeSearchQuery,
} from "@/lib/product-search";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ category?: string; q?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category, q } = await searchParams;
  const t = await getTranslations({ locale, namespace: "products" });
  const tSearch = await getTranslations({ locale, namespace: "search" });
  const categories = await listCategories({ activeOnly: true });
  const keys = categories.map((c) => c.key);
  const query = normalizeSearchQuery(q);

  if (query) {
    return { title: `${tSearch("resultsFor", { query })} | LuminaTech` };
  }
  if (isValidCategoryKey(category, keys)) {
    return {
      title: `${categoryLabels(category, locale, categories)} | ${t("title")}`,
    };
  }
  return { title: t("title") };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category: categoryParam, q } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("products");
  const tSearch = await getTranslations("search");

  const categories = await listCategories({ activeOnly: true });
  const keys = categories.map((c) => c.key);
  const activeCategory = isValidCategoryKey(categoryParam, keys) ? categoryParam : null;
  const searchQuery = normalizeSearchQuery(q);

  const [products, categoryGroups] = await Promise.all([
    prisma.product.findMany({
      where: buildProductSearchWhere(searchQuery, activeCategory),
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.groupBy({
      by: ["categoryKey"],
      where: { active: true },
      _count: { _all: true },
    }),
  ]);

  const localized = products.map((p) => localizeProduct(p, locale));
  const ratingMap = await getProductRatingMap(products.map((p) => p.id));

  const counts = Object.fromEntries(
    categoryGroups.map((g) => [g.categoryKey, g._count._all]),
  );

  const pageTitle = searchQuery
    ? tSearch("resultsFor", { query: searchQuery })
    : activeCategory
      ? categoryLabels(activeCategory, locale, categories)
      : t("title");

  const countLabel = searchQuery
    ? tSearch("resultCount", { count: localized.length })
    : activeCategory
      ? t("categoryCount", { count: localized.length })
      : t("count", { count: localized.length });

  return (
    <>
      <ProductCategoryNav
        active={activeCategory}
        counts={counts}
        categories={categories}
        locale={locale}
        searchQuery={searchQuery}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">{pageTitle}</h1>
            <p className="mt-2 text-zinc-500">{countLabel}</p>
            {searchQuery ? (
              <ClearSearchLink category={activeCategory} />
            ) : null}
          </div>
          <div className="w-full sm:max-w-sm">
            <SearchBar
              variant="header"
              defaultValue={searchQuery}
              category={activeCategory}
            />
          </div>
        </div>

        {localized.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center text-zinc-500">
            {searchQuery ? tSearch("empty") : t("emptyCategory")}
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
                  compareAtPrice={product.compareAtPrice}
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
