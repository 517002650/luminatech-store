import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ChevronRight, Download } from "lucide-react";
import { AccountNav } from "@/components/account/AccountNav";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { SafeImage } from "@/components/SafeImage";
import { Link } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/lib/user-auth";
import {
  formatOrderId,
  parseOrderItems,
  type OrderStatus,
} from "@/lib/orders";
import {
  getDownloadCountByProductId,
  orderStatusAllowsDownloads,
} from "@/lib/product-downloads";
import { prisma } from "@/lib/db";
import {
  darkCardClass,
  darkCardHoverClass,
  darkEmptyStateClass,
  darkHeadingClass,
  darkMetaClass,
  darkThumbStackClass,
} from "@/lib/dark-surface-styles";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: `${t("orders")} | LuminaTech` };
}

export default async function AccountOrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account/orders");

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId: user.id }, { email: user.email }],
    },
    orderBy: { createdAt: "desc" },
  });

  await prisma.order.updateMany({
    where: { email: user.email, userId: null },
    data: { userId: user.id },
  });

  const allProductIds = [
    ...new Set(
      orders.flatMap((order) => parseOrderItems(order.items).map((i) => i.productId)),
    ),
  ];
  const downloadCounts = await getDownloadCountByProductId(allProductIds);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className={`text-2xl font-bold ${darkHeadingClass}`}>{t("myAccount")}</h1>
      <p className={`mt-1 text-sm ${darkMetaClass}`}>{user.email}</p>
      <div className="mt-6">
        <AccountNav />
      </div>

      {orders.length === 0 ? (
        <div className={`mt-10 p-12 text-center ${darkEmptyStateClass}`}>
          <p>{t("noOrders")}</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const items = parseOrderItems(order.items);
            const itemCount = items.reduce((s, i) => s + i.quantity, 0);
            const preview = items.slice(0, 3);
            const extra = items.length - preview.length;
            const names = items
              .slice(0, 2)
              .map((i) => (locale === "zh" ? i.nameZh : i.nameEn))
              .join(locale === "zh" ? "、" : ", ");
            const moreNames = items.length > 2 ? (locale === "zh" ? " 等" : "…") : "";
            const downloadFileCount = orderStatusAllowsDownloads(order.status)
              ? items.reduce(
                  (sum, item) => sum + (downloadCounts.get(item.productId) ?? 0),
                  0,
                )
              : 0;

            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className={`block p-5 sm:p-6 ${darkCardClass} ${darkCardHoverClass}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-base font-semibold tracking-wide text-zinc-50">
                        #{formatOrderId(order.id)}
                      </p>
                      {downloadFileCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-100 ring-1 ring-cyan-400/40">
                          <Download className="h-3.5 w-3.5" />
                          {t("hasDownloads", { count: downloadFileCount })}
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-1.5 text-sm font-medium ${darkMetaClass}`}>
                      {new Date(order.createdAt).toLocaleString(
                        locale === "zh" ? "zh-CN" : "en-US",
                      )}
                      {" · "}
                      {itemCount} {t("items")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-zinc-50">
                      {formatPrice(order.total)}
                    </p>
                    <OrderStatusBadge
                      status={order.status}
                      label={t(`statuses.${order.status as OrderStatus}`)}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-zinc-700/80 pt-5">
                  <div className="flex -space-x-2.5">
                    {preview.map((item) => (
                      <div
                        key={item.productId}
                        className={`h-14 w-14 ${darkThumbStackClass}`}
                      >
                        <SafeImage
                          src={item.image}
                          alt={locale === "zh" ? item.nameZh : item.nameEn}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {extra > 0 ? (
                      <div
                        className={`flex h-14 w-14 items-center justify-center text-sm font-semibold text-zinc-700 ${darkThumbStackClass}`}
                      >
                        +{extra}
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-zinc-50">
                      {names}
                      {moreNames}
                    </p>
                    <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300 underline-offset-2 hover:underline">
                      {downloadFileCount > 0 ? t("viewOrderDownloads") : t("viewDetails")}
                      <ChevronRight className="h-4 w-4" />
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
