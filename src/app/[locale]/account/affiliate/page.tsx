import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/AccountNav";
import { formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/lib/user-auth";
import { buildAffiliateLink } from "@/lib/affiliates";
import { formatOrderId } from "@/lib/orders";
import { prisma } from "@/lib/db";
import {
  darkCardClass,
  darkEmptyStateClass,
  darkHeadingClass,
  darkMetaClass,
} from "@/lib/dark-surface-styles";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

const STATUS_KEYS = ["pending", "approved", "paid", "void"] as const;

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: `${t("affiliate")} | LuminaTech` };
}

export default async function AccountAffiliatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account/affiliate");

  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: user.id },
    include: {
      commissions: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          order: { select: { id: true, total: true, status: true, email: true } },
        },
      },
    },
  });

  if (!affiliate) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className={`mb-6 ${darkHeadingClass}`}>{t("myAccount")}</h1>
        <AccountNav />
        <div className={`mt-8 ${darkEmptyStateClass}`}>
          <p className="font-medium text-zinc-200">{t("affiliateNotMember")}</p>
          <p className={`mt-2 ${darkMetaClass}`}>{t("affiliateNotMemberHint")}</p>
        </div>
      </div>
    );
  }

  const link = buildAffiliateLink(affiliate.code);
  const sums = Object.fromEntries(
    STATUS_KEYS.map((s) => [
      s,
      affiliate.commissions
        .filter((c) => c.status === s)
        .reduce((n, c) => n + c.amount, 0),
    ]),
  ) as Record<(typeof STATUS_KEYS)[number], number>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className={`mb-6 ${darkHeadingClass}`}>{t("myAccount")}</h1>
      <AccountNav />

      <section className={`mt-8 space-y-4 ${darkCardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">{t("affiliate")}</h2>
            <p className={`mt-1 ${darkMetaClass}`}>{t("affiliateHint")}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              affiliate.active
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-zinc-700 text-zinc-400"
            }`}
          >
            {affiliate.active ? t("affiliateActive") : t("affiliateInactive")}
          </span>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className={darkMetaClass}>{t("affiliateCode")}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold text-zinc-50">
              {affiliate.code}
            </dd>
          </div>
          <div>
            <dt className={darkMetaClass}>{t("affiliateRate")}</dt>
            <dd className="mt-1 text-lg font-semibold text-zinc-50">
              {affiliate.commissionRate}%
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={darkMetaClass}>{t("affiliateLink")}</dt>
            <dd className="mt-1 break-all font-mono text-sm text-cyan-300">
              {link}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_KEYS.map((status) => (
          <div key={status} className={`${darkCardClass} p-4`}>
            <p className={darkMetaClass}>{t(`affiliateStatuses.${status}`)}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-50">
              {formatPrice(sums[status] ?? 0)}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-100">
          {t("affiliateCommissions")}
        </h2>
        {affiliate.commissions.length === 0 ? (
          <div className={darkEmptyStateClass}>{t("affiliateNoCommissions")}</div>
        ) : (
          <div className={`overflow-hidden ${darkCardClass}`}>
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-700/80 text-left text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("order")}</th>
                  <th className="px-4 py-3 font-medium">{t("affiliateBase")}</th>
                  <th className="px-4 py-3 font-medium">{t("affiliateAmount")}</th>
                  <th className="px-4 py-3 font-medium">{t("status")}</th>
                  <th className="px-4 py-3 font-medium">{t("affiliateDate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {affiliate.commissions.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-zinc-200">
                      {formatOrderId(row.orderId)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatPrice(row.baseAmount)}
                      <span className="text-zinc-500"> · {row.rate}%</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-50">
                      {formatPrice(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {t(
                        `affiliateStatuses.${
                          STATUS_KEYS.includes(row.status as (typeof STATUS_KEYS)[number])
                            ? row.status
                            : "pending"
                        }`,
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {row.createdAt.toLocaleDateString(
                        locale === "zh" ? "zh-CN" : "en-US",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
