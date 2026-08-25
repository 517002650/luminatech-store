import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { localizeProduct } from "@/lib/product-i18n";
import {
  displayReviewerName,
  getProductRatingMap,
  getProductReviews,
} from "@/lib/reviews";
import { getSiteSettings } from "@/lib/site-settings";
import { getCurrentUser } from "@/lib/user-auth";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductMarkdown } from "@/components/ProductMarkdown";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { ProductRating } from "@/components/ProductRating";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { ProductDownloadsSection } from "@/components/ProductDownloadsSection";
import { userHasPurchasedProduct } from "@/lib/product-downloads";
import { ensureDefaultVariant, toPublicVariants } from "@/lib/product-variants";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || !product.active) {
    const t = await getTranslations({ locale, namespace: "products" });
    return { title: t("notFound") };
  }
  const localized = localizeProduct(product, locale);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const url = `${appUrl}/${locale}/products/${product.slug}`;
  const description = localized.shortDesc.slice(0, 160);
  const image = product.image.startsWith("http")
    ? product.image
    : product.image
      ? `${appUrl}${product.image.startsWith("/") ? "" : "/"}${product.image}`
      : undefined;

  return {
    title: `${localized.name} | Stagevio`,
    description,
    openGraph: {
      title: localized.name,
      description,
      url,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: localized.name,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: url,
      languages: {
        en: `${appUrl}/en/products/${product.slug}`,
        zh: `${appUrl}/zh/products/${product.slug}`,
      },
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("product");
  const tReviews = await getTranslations("reviews");

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!product || !product.active) notFound();

  if (product.variants.length === 0) {
    await ensureDefaultVariant(product.id);
  }
  const variantRows =
    product.variants.length > 0
      ? product.variants
      : await prisma.productVariant.findMany({
          where: { productId: product.id },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });
  const variants = toPublicVariants(variantRows);

  const p = localizeProduct(product, locale);
  const user = await getCurrentUser();

  const [ratingMap, reviews, wishlistItem, userReview, purchased, siteSettings] =
    await Promise.all([
    getProductRatingMap([product.id]),
    getProductReviews(product.id),
    user
      ? prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        })
      : null,
    user
      ? prisma.review.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        })
      : null,
    userHasPurchasedProduct(user, product.id),
    getSiteSettings(),
  ]);

  const downloads = purchased
    ? await prisma.productDownload.findMany({
        where: { productId: product.id },
        orderBy: [{ type: "asc" }, { isLatest: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const rating = ratingMap.get(product.id);
  const reviewItems = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    content: review.content,
    createdAt: review.createdAt,
    authorName: displayReviewerName(review.user.name, review.user.email),
    verifiedPurchase: review.verifiedPurchase,
  }));

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const productUrl = `${appUrl}/${locale}/products/${product.slug}`;
  const offerVariants = variants.filter((v) => v.active);
  const lowPrice = Math.min(...offerVariants.map((v) => v.price), p.price);
  const highPrice = Math.max(...offerVariants.map((v) => v.price), p.price);
  const anyInStock = offerVariants.some((v) => v.stock > 0) || p.stock > 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDesc,
    sku: p.sku,
    brand: { "@type": "Brand", name: p.brand },
    image: p.gallery.filter((src) => src.startsWith("http")),
    offers:
      offerVariants.length > 1
        ? {
            "@type": "AggregateOffer",
            url: productUrl,
            priceCurrency: "USD",
            lowPrice: lowPrice.toFixed(2),
            highPrice: highPrice.toFixed(2),
            offerCount: offerVariants.length,
            availability: anyInStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          }
        : {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "USD",
            price: lowPrice.toFixed(2),
            availability: anyInStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
    ...(rating && rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.avg.toFixed(1),
            reviewCount: rating.count,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-12 lg:grid-cols-2">
        <ProductGallery images={p.gallery} alt={p.name} />

        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-cyan-400">
            {p.category}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-50">{p.name}</h1>
          {rating && rating.count > 0 && (
            <div className="mt-3">
              <ProductRating avg={rating.avg} count={rating.count} size="md" />
            </div>
          )}
          <p className="mt-3 text-lg text-zinc-400">{p.shortDesc}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm">
            <div>
              <dt className="text-zinc-500">{t("brand")}</dt>
              <dd className="font-medium text-zinc-100">{p.brand}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("warranty")}</dt>
              <dd className="font-medium text-zinc-100">{p.warranty}</dd>
            </div>
          </dl>

          <ProductPurchasePanel
            productId={p.id}
            slug={p.slug}
            nameEn={p.nameEn}
            nameZh={p.nameZh}
            image={p.image}
            variants={variants}
            initialWishlisted={Boolean(wishlistItem)}
          />
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold text-zinc-50">{t("highlights")}</h2>
          <ul className="mt-4 space-y-3">
            {p.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-zinc-300"
              >
                <span className="mt-0.5 text-cyan-400">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-50">{t("specs")}</h2>
          <dl className="mt-4 overflow-hidden rounded-2xl border border-zinc-800">
            {p.specs.map((spec, index) => (
              <div
                key={spec.label}
                className={`grid grid-cols-2 gap-4 px-4 py-3 text-sm ${
                  index % 2 === 0 ? "bg-zinc-900/80" : "bg-zinc-900/40"
                }`}
              >
                <dt className="font-medium text-zinc-400">{spec.label}</dt>
                <dd className="text-zinc-100">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-xl font-bold text-zinc-50">{t("description")}</h2>
        <div className="mt-4 leading-relaxed text-zinc-400">
          <ProductMarkdown content={p.description} />
        </div>
      </section>

      {purchased && downloads.length > 0 ? (
        <ProductDownloadsSection
          items={downloads.map((d) => ({
            id: d.id,
            type: d.type,
            version: d.version,
            title: locale === "zh" ? d.titleZh : d.titleEn,
            notes: locale === "zh" ? d.notesZh : d.notesEn,
            fileName: d.fileName,
            fileSize: d.fileSize,
            isLatest: d.isLatest,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      ) : null}

      <section className="mt-12">
        <h2 className="text-xl font-bold text-zinc-50">{t("reviews")}</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <ReviewForm
            productId={p.id}
            slug={p.slug}
            isLoggedIn={Boolean(user)}
            hasPurchased={purchased}
            reviewBanned={Boolean(user?.bannedFromReviews)}
            moderationEnabled={siteSettings.reviewModerationEnabled}
            userReview={
              userReview
                ? {
                    rating: userReview.rating,
                    title: userReview.title,
                    content: userReview.content,
                    approved: userReview.approved,
                  }
                : null
            }
          />
          <div>
            {rating && rating.count > 0 ? (
              <ReviewList
                reviews={reviewItems}
                avg={rating.avg}
                count={rating.count}
                verifiedLabel={tReviews("verifiedPurchase")}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-sm text-zinc-500">
                {t("noReviews")}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
