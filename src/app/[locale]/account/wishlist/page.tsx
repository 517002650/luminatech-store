import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountNav } from "@/components/account/AccountNav";
import { ProductCard } from "@/components/ProductCard";
import { removeWishlistItemAction } from "@/app/actions/user";
import { getCurrentUser } from "@/lib/user-auth";
import { localizeProduct } from "@/lib/product-i18n";
import { getProductRatingMap } from "@/lib/reviews";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: `${t("wishlist")} | LuminaTech` };
}

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account/wishlist");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const productIds = items.map((i) => i.productId);
  const ratingMap = await getProductRatingMap(productIds);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">{t("myAccount")}</h1>
      <div className="mt-6">
        <AccountNav />
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <p className="text-stone-600">{t("emptyWishlist")}</p>
          <Link href="/products" className="mt-4 inline-block text-amber-600 hover:underline">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ product, productId }) => {
            const p = localizeProduct(product, locale);
            const rating = ratingMap.get(productId);
            return (
              <div key={productId} className="relative">
                <ProductCard
                  slug={p.slug}
                  name={p.name}
                  price={p.price}
                  image={p.image}
                  category={p.category}
                  avgRating={rating?.avg}
                  reviewCount={rating?.count}
                />
                <form
                  action={removeWishlistItemAction.bind(null, productId)}
                  className="absolute right-3 top-3"
                >
                  <button
                    type="submit"
                    className="rounded-full bg-white/90 px-2 py-1 text-xs text-red-600 shadow hover:bg-white"
                  >
                    {t("remove")}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
