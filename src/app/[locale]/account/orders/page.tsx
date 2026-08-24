import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
import { prisma } from "@/lib/db";
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-50">{t("myAccount")}</h1>
      <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      <div className="mt-6">
        <AccountNav />
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center">
          <p className="text-zinc-400">{t("noOrders")}</p>
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

            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 transition hover:border-cyan-500/40 hover:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-zinc-100">
                      #{formatOrderId(order.id)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(order.createdAt).toLocaleString(
                        locale === "zh" ? "zh-CN" : "en-US",
                      )}
                      {" · "}
                      {itemCount} {t("items")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-zinc-50">
                      {formatPrice(order.total)}
                    </p>
                    <OrderStatusBadge
                      status={order.status}
                      label={t(`statuses.${order.status as OrderStatus}`)}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-800 pt-4">
                  <div className="flex -space-x-2">
                    {preview.map((item) => (
                      <div
                        key={item.productId}
                        className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-zinc-900 bg-zinc-800"
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-zinc-900 bg-zinc-800 text-xs font-medium text-zinc-300">
                        +{extra}
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-300">
                      {names}
                      {moreNames}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400">
                      {t("viewDetails")}
                      <ChevronRight className="h-3.5 w-3.5" />
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
