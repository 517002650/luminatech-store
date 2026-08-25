import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceDashboard } from "@/components/admin/FinanceDashboard";
import { requirePermission } from "@/lib/admin-auth";
import {
  getAffiliatePayoutSummary,
  getOrderLedger,
  resolveFinanceDateRange,
} from "@/lib/finance-report";

type Props = {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function AdminFinancePage({ searchParams }: Props) {
  const admin = await requirePermission("finance");
  const sp = await searchParams;
  const range = resolveFinanceDateRange(sp);

  const [{ summary, orders }, payouts] = await Promise.all([
    getOrderLedger(range),
    getAffiliatePayoutSummary(range),
  ]);

  return (
    <AdminShell
      title="财务"
      subtitle="经营账本与推广提成结算。不是税务发票；支付通道手续费需在 Stripe/PayPal 后台查看。"
      admin={admin}
    >
      <FinanceDashboard
        range={range}
        summary={summary}
        orders={orders}
        payouts={payouts}
      />
    </AdminShell>
  );
}
