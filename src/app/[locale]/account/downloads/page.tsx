import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Download, History, Star } from "lucide-react";
import { AccountNav } from "@/components/account/AccountNav";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import {
  DOWNLOAD_TYPES,
  formatFileSize,
  getPurchasedProductIds,
  type DownloadType,
} from "@/lib/product-downloads";
import { getCurrentUser } from "@/lib/user-auth";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: `${t("downloads")} | LuminaTech` };
}

export default async function AccountDownloadsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const tProduct = await getTranslations("product");

  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account/downloads");

  await prisma.order.updateMany({
    where: { email: user.email, userId: null },
    data: { userId: user.id },
  });

  const purchasedIds = await getPurchasedProductIds(user);

  const products =
    purchasedIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: {
            id: { in: purchasedIds },
            downloads: { some: {} },
          },
          include: {
            downloads: {
              orderBy: [{ type: "asc" }, { isLatest: "desc" }, { createdAt: "desc" }],
            },
          },
          orderBy: { nameEn: "asc" },
        });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">{t("myAccount")}</h1>
      <p className="mt-1 text-sm text-stone-500">{user.email}</p>
      <div className="mt-6">
        <AccountNav />
      </div>

      <p className="mt-6 text-sm text-stone-500">{t("downloadsHint")}</p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <p className="text-stone-600">{t("noDownloads")}</p>
          <Link href="/products" className="mt-4 inline-block text-amber-600 hover:underline">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {products.map((product) => {
            const name = locale === "zh" ? product.nameZh : product.nameEn;
            const grouped = DOWNLOAD_TYPES.map((type) => ({
              type,
              rows: product.downloads.filter((d) => d.type === type),
            })).filter((g) => g.rows.length > 0);

            return (
              <section
                key={product.id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50 px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-stone-900">{name}</h2>
                    <p className="text-xs text-stone-500">{product.sku}</p>
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm text-amber-600 hover:underline"
                  >
                    {t("viewProduct")}
                  </Link>
                </div>

                <div className="space-y-6 p-5">
                  {grouped.map(({ type, rows }) => (
                    <div key={type}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        {tProduct(`downloadTypes.${type as DownloadType}`)}
                      </h3>
                      <ul className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200">
                        {rows.map((row) => (
                          <li
                            key={row.id}
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-stone-900">
                                {locale === "zh" ? row.titleZh : row.titleEn}
                                <span className="ml-2 text-sm font-normal text-stone-500">
                                  v{row.version}
                                </span>
                                {row.isLatest ? (
                                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                                    <Star className="h-3 w-3" />
                                    {tProduct("downloadLatest")}
                                  </span>
                                ) : (
                                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-stone-400">
                                    <History className="h-3 w-3" />
                                    {tProduct("downloadHistory")}
                                  </span>
                                )}
                              </p>
                              {(locale === "zh" ? row.notesZh : row.notesEn) ? (
                                <p className="mt-1 text-sm text-stone-500">
                                  {locale === "zh" ? row.notesZh : row.notesEn}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs text-stone-400">
                                {row.fileName} · {formatFileSize(row.fileSize)} ·{" "}
                                {new Date(row.createdAt).toLocaleDateString(
                                  locale === "zh" ? "zh-CN" : "en-US",
                                )}
                              </p>
                            </div>
                            <a
                              href={`/api/downloads/${row.id}`}
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
                            >
                              <Download className="h-4 w-4" />
                              {tProduct("downloadButton")}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
