import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { localizeProduct } from "@/lib/product-i18n";
import { getProductRatingMap } from "@/lib/reviews";
import { ProductCard } from "@/components/ProductCard";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const products = await prisma.product.findMany({
    where: { featured: true },
    take: 3,
  });
  const featured = products.map((p) => localizeProduct(p, locale));
  const ratingMap = await getProductRatingMap(products.map((p) => p.id));

  const features = ["shipping", "payment", "warranty"] as const;

  return (
    <>
      <section className="bg-gradient-to-br from-slate-900 via-stone-900 to-stone-800 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
              {t("badge")}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-stone-300">{t("subtitle")}</p>
            <Link
              href="/products"
              className="mt-8 inline-block rounded-xl bg-amber-500 px-8 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-400"
            >
              {t("cta")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 rounded-3xl bg-amber-500/20" />
            <div className="mt-8 h-48 rounded-3xl bg-white/10" />
            <div className="col-span-2 h-32 rounded-3xl bg-indigo-500/20" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">{t("featuredTitle")}</h2>
            <p className="mt-2 text-stone-500">{t("featuredSubtitle")}</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-amber-600 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => {
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
      </section>

      <section id="about" className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold text-stone-900">{t("whyTitle")}</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {features.map((key) => (
              <div key={key} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-stone-900">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="mt-2 text-stone-600">{t(`features.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
