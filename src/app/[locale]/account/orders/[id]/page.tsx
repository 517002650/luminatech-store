import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountNav } from "@/components/account/AccountNav";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
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
import { ShippingAddressDisplay } from "@/components/ShippingAddressDisplay";
import { prisma } from "@/lib/db";
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
          <h1 className="text-2xl font-bold text-zinc-50">
            {t("order")} #{formatOrderId(order.id)}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
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

      <dl className="mt-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-zinc-500">{t("status")}</dt>
          <dd className="mt-2">
            <OrderStatusBadge
              status={order.status}
              label={t(`statuses.${order.status as OrderStatus}`)}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{t("payment")}</dt>
          <dd className="mt-2 text-base font-semibold capitalize text-zinc-100">
            {order.paymentMethod}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{t("total")}</dt>
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
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          {t("orderItems")}
        </h2>
        <div className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
          {localizedItems.map((item) => (
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
                  <p className="text-sm text-zinc-500">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-base font-semibold text-zinc-50">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
