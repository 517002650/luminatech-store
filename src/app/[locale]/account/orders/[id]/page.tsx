import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Download } from "lucide-react";
import { AccountNav } from "@/components/account/AccountNav";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { ProductDownloadsSection } from "@/components/ProductDownloadsSection";
import { RepurchaseButton } from "@/components/RepurchaseButton";
import { SafeImage } from "@/components/SafeImage";
import { Link } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/lib/user-auth";
import {
  formatOrderId,
  parseOrderItems,
  parseShippingAddress,
  type OrderStatus,
} from "@/lib/orders";
import {
  getDownloadsForProductIds,
  orderStatusAllowsDownloads,
} from "@/lib/product-downloads";
import { ShippingAddressDisplay } from "@/components/ShippingAddressDisplay";
import { prisma } from "@/lib/db";
import {
  darkCardClass,
  darkHeadingClass,
  darkLabelClass,
  darkMetaClass,
  darkPanelClass,
} from "@/lib/dark-surface-styles";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: Locale; id: string }>;
};

export default async function AccountOrderDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account/orders");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  const ownsOrder =
    order.userId === user.id ||
    (order.email && order.email.toLowerCase() === user.email.toLowerCase());
  if (!ownsOrder) notFound();

  const items = parseOrderItems(order.items);
  const shipping = parseShippingAddress(order.shippingAddress);
  const localizedItems = items.map((item) => ({
    ...item,
    name: locale === "zh" ? item.nameZh : item.nameEn,
  }));

  const canDownload = orderStatusAllowsDownloads(order.status);
  const productIds = [...new Set(items.map((i) => i.productId))];
  const downloads = canDownload ? await getDownloadsForProductIds(productIds) : [];
  const productNameById = new Map(
    localizedItems.map((item) => [item.productId, item.name]),
  );

  const downloadsByProduct = productIds
    .map((productId) => {
      const rows = downloads.filter((d) => d.productId === productId);
      if (rows.length === 0) return null;
      return {
        productId,
        productName: productNameById.get(productId) ?? productId,
        items: rows.map((d) => ({
          id: d.id,
          type: d.type,
          version: d.version,
          title: locale === "zh" ? d.titleZh : d.titleEn,
          notes: locale === "zh" ? d.notesZh : d.notesEn,
          fileName: d.fileName,
          fileSize: d.fileSize,
          isLatest: d.isLatest,
          createdAt: d.createdAt.toISOString(),
        })),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/account/orders"
        className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline"
      >
        ← {t("backToOrders")}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkHeadingClass}`}>
            {t("order")} #{formatOrderId(order.id)}
          </h1>
          <p className={`mt-1 text-sm ${darkMetaClass}`}>
            {new Date(order.createdAt).toLocaleString(
              locale === "zh" ? "zh-CN" : "en-US",
            )}
          </p>
        </div>
        <RepurchaseButton items={items} />
      </div>

      <div className="mt-6">
        <AccountNav />
      </div>

      <dl className={`mt-8 grid gap-4 p-6 sm:grid-cols-3 ${darkPanelClass}`}>
        <div>
          <dt className={`text-xs ${darkLabelClass}`}>{t("status")}</dt>
          <dd className="mt-2">
            <OrderStatusBadge
              status={order.status}
              label={t(`statuses.${order.status as OrderStatus}`)}
            />
          </dd>
        </div>
        <div>
          <dt className={`text-xs ${darkLabelClass}`}>{t("payment")}</dt>
          <dd className="mt-2 text-base font-semibold capitalize text-zinc-100">
            {order.paymentMethod}
          </dd>
        </div>
        <div>
          <dt className={`text-xs ${darkLabelClass}`}>{t("total")}</dt>
          <dd className="mt-2 text-xl font-bold text-zinc-50">
            {formatPrice(order.total)}
          </dd>
        </div>
      </dl>

      {shipping ? (
        <div className="mt-8">
          <ShippingAddressDisplay
            address={shipping}
            title={t("shippingAddress")}
            locale={locale}
            labels={{
              name: t("addrName"),
              phone: t("addrPhone"),
              email: t("addrEmail"),
              address: t("addrLine"),
              city: t("addrCity"),
              postal: t("addrPostal"),
              country: t("addrCountry"),
            }}
          />
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wider ${darkLabelClass}`}>
          {t("orderItems")}
        </h2>
        <div className={`divide-y divide-zinc-700/80 overflow-hidden ${darkCardClass}`}>
          {localizedItems.map((item) => {
            const fileCount = downloads.filter((d) => d.productId === item.productId).length;
            return (
              <div key={item.productId} className="flex gap-4 p-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-semibold text-zinc-100 hover:text-cyan-300 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className={`text-sm ${darkMetaClass}`}>
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                    {fileCount > 0 ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400">
                        <Download className="h-3 w-3" />
                        {t("itemHasDownloads", { count: fileCount })}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-base font-semibold text-zinc-50">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {downloadsByProduct.length > 0 ? (
        <div className="mt-10 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className={`text-xl font-bold ${darkHeadingClass}`}>{t("orderDownloads")}</h2>
              <p className={`mt-1 text-sm ${darkMetaClass}`}>{t("orderDownloadsHint")}</p>
            </div>
            <Link
              href="/account/downloads"
              className="text-sm text-cyan-400 hover:underline"
            >
              {t("allDownloads")}
            </Link>
          </div>

          {downloadsByProduct.map((group) => (
              <div key={group.productId}>
                <h3 className="mb-2 text-sm font-medium text-zinc-200">
                  {group.productName}
                </h3>
                <ProductDownloadsSection items={group.items} compact />
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}
