import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/AccountNav";
import { Link } from "@/i18n/routing";
import { formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/lib/user-auth";
import { formatOrderId, ORDER_STATUS_LABELS, parseOrderItems, type OrderStatus } from "@/lib/orders";
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

  // Link orphan orders by email to user
  await prisma.order.updateMany({
    where: { email: user.email, userId: null },
    data: { userId: user.id },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">{t("myAccount")}</h1>
      <p className="mt-1 text-sm text-stone-500">{user.email}</p>
      <div className="mt-6">
        <AccountNav />
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <p className="text-stone-600">{t("noOrders")}</p>
          <Link href="/products" className="mt-4 inline-block text-amber-600 hover:underline">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const itemCount = parseOrderItems(order.items).reduce(
              (s, i) => s + i.quantity,
              0,
            );
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-amber-300 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono font-semibold text-stone-900">
                      #{formatOrderId(order.id)}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {new Date(order.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                      {" · "}
                      {itemCount} {t("items")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-stone-900">{formatPrice(order.total)}</p>
                    <p className="mt-1 text-sm text-amber-600">
                      {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
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
