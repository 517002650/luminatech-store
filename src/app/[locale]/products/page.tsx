import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { localizeProduct } from "@/lib/product-i18n";
import { getProductRatingMap } from "@/lib/reviews";
import { ProductCard } from "@/components/ProductCard";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  return { title: t("title") };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  const localized = products.map((p) => localizeProduct(p, locale));
  const ratingMap = await getProductRatingMap(products.map((p) => p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-stone-900">{t("title")}</h1>
      <p className="mt-2 text-stone-500">{t("count", { count: localized.length })}</p>
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
    </div>
  );
}
