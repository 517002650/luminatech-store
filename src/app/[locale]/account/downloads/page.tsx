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
      <h1 className="text-2xl font-bold text-zinc-50">{t("myAccount")}</h1>
      <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      <div className="mt-6">
        <AccountNav />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-zinc-50">{t("downloads")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("downloadsHint")}</p>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center">
          <p className="text-zinc-400">{t("noDownloads")}</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 hover:underline"
          >
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
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/50 px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-zinc-50">{name}</h2>
                    <p className="text-xs text-zinc-500">{product.sku}</p>
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm text-cyan-400 hover:underline"
                  >
                    {t("viewProduct")}
                  </Link>
                </div>

                <div className="space-y-6 p-5">
                  {grouped.map(({ type, rows }) => (
                    <div key={type}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
                        {tProduct(`downloadTypes.${type as DownloadType}`)}
                      </h3>
                      <ul className="mt-2 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
                        {rows.map((row) => (
                          <li
                            key={row.id}
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-zinc-100">
                                {locale === "zh" ? row.titleZh : row.titleEn}
                                <span className="ml-2 text-sm font-normal text-zinc-500">
                                  v{row.version}
                                </span>
                                {row.isLatest ? (
                                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-300">
                                    <Star className="h-3 w-3" />
                                    {tProduct("downloadLatest")}
                                  </span>
                                ) : (
                                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-zinc-500">
                                    <History className="h-3 w-3" />
                                    {tProduct("downloadHistory")}
                                  </span>
                                )}
                              </p>
                              {(locale === "zh" ? row.notesZh : row.notesEn) ? (
                                <p className="mt-1 text-sm text-zinc-500">
                                  {locale === "zh" ? row.notesZh : row.notesEn}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs text-zinc-600">
                                {row.fileName} · {formatFileSize(row.fileSize)} ·{" "}
                                {new Date(row.createdAt).toLocaleDateString(
                                  locale === "zh" ? "zh-CN" : "en-US",
                                )}
                              </p>
                            </div>
                            <a
                              href={`/api/downloads/${row.id}`}
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-cyan-500 hover:to-violet-500"
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
