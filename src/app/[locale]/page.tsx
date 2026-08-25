import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Lightbulb, Package, Radio, SlidersHorizontal, Zap } from "lucide-react";
import { listCategories } from "@/lib/categories";
import { prisma } from "@/lib/db";
import { localizeProduct } from "@/lib/product-i18n";
import { getProductRatingMap } from "@/lib/reviews";
import { ProductCard } from "@/components/ProductCard";
import { StageHeroVisual } from "@/components/StageHeroVisual";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale }>;
};

const categoryIcons: Record<string, typeof Lightbulb> = {
  consoles: SlidersHorizontal,
  lasers: Zap,
  fixtures: Lightbulb,
  effects: Radio,
  accessories: Package,
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  let featured: ReturnType<typeof localizeProduct>[] = [];
  let ratingMap = new Map<string, { avg: number; count: number }>();
  let dbError = "";
  let homeCategories: Awaited<ReturnType<typeof listCategories>> = [];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { featured: true, active: true },
        take: 3,
      }),
      listCategories({ activeOnly: true }),
    ]);
    featured = products.map((p) => localizeProduct(p, locale));
    ratingMap = await getProductRatingMap(products.map((p) => p.id));
    homeCategories = categories.slice(0, 4);
  } catch (err) {
    console.error("Home page DB error:", err);
    dbError = err instanceof Error ? err.message : "Database error";
  }

  const features = ["shipping", "payment", "warranty"] as const;

  return (
    <>
      <section className="relative overflow-hidden bg-zinc-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08)_0%,_transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.06)_0%,_transparent_40%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
              {t("badge")}
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-zinc-400">{t("subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary">
                {t("cta")}
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>
          <StageHeroVisual />
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
            {t("categoriesTitle")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {homeCategories.map((cat) => {
              const Icon = categoryIcons[cat.key] ?? Package;
              const knownI18n = ["consoles", "lasers", "fixtures", "effects"].includes(cat.key);
              return (
                <Link
                  key={cat.key}
                  href={`/products?category=${cat.key}`}
                  className="category-card group text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 ring-1 ring-cyan-500/20 transition group-hover:ring-cyan-500/40">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-100">
                    {knownI18n
                      ? t(`categories.${cat.key}.title`)
                      : locale === "zh"
                        ? cat.zh
                        : cat.en}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {knownI18n
                      ? t(`categories.${cat.key}.desc`)
                      : locale === "zh"
                        ? cat.en
                        : cat.zh}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-zinc-50">{t("featuredTitle")}</h2>
            <p className="mt-2 text-zinc-500">{t("featuredSubtitle")}</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
            {t("viewAll")} →
          </Link>
        </div>
        {dbError ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200">
            商品数据暂时无法加载。请确认已配置 PostgreSQL（DATABASE_URL）并重新部署。
            <pre className="mt-2 overflow-auto text-xs text-amber-300/80">{dbError}</pre>
          </div>
        ) : (
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
        )}
      </section>

      <section id="about" className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold text-zinc-50">{t("whyTitle")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-cyan-500/20"
              >
                <h3 className="font-semibold text-zinc-100">{t(`features.${key}.title`)}</h3>
                <p className="mt-2 text-zinc-400">{t(`features.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
