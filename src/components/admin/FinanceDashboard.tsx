"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markApprovedCommissionsPaidAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import { formatOrderId, ORDER_STATUS_LABELS } from "@/lib/orders";
import type {
  AffiliatePayoutRow,
  FinanceDateRange,
  FinanceOrderRow,
  OrderLedgerSummary,
} from "@/lib/finance-report";

type Props = {
  range: FinanceDateRange;
  summary: OrderLedgerSummary;
  orders: FinanceOrderRow[];
  payouts: AffiliatePayoutRow[];
};

const RANGE_TABS: { key: string; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "7d", label: "近 7 天" },
  { key: "month", label: "本月" },
  { key: "custom", label: "自定义" },
];

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-900">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-stone-400">{hint}</p> : null}
    </div>
  );
}

export function FinanceDashboard({ range, summary, orders, payouts }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const approvedIds = payouts.flatMap((p) => p.approvedIds);
  const approvedTotal = payouts.reduce((n, p) => n + p.approved, 0);

  function goRange(key: string) {
    const q = new URLSearchParams();
    q.set("range", key);
    if (key === "custom") {
      q.set("from", range.fromStr);
      q.set("to", range.toStr);
    }
    router.push(`/admin/finance?${q.toString()}`);
  }

  const exportOrdersHref = `/api/admin/orders/export?from=${range.fromStr}&to=${range.toStr}`;
  const exportCommissionsHref = `/api/admin/commissions/export?from=${range.fromStr}&to=${range.toStr}`;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {RANGE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => goRange(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  range.range === tab.key
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={exportOrdersHref}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            >
              导出本周期订单
            </a>
            <a
              href={exportCommissionsHref}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            >
              导出本周期提成
            </a>
          </div>
        </div>

        {range.range === "custom" ? (
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const from = String(fd.get("from") ?? "");
              const to = String(fd.get("to") ?? "");
              const q = new URLSearchParams({ range: "custom", from, to });
              router.push(`/admin/finance?${q.toString()}`);
            }}
          >
            <label className="text-sm text-stone-600">
              起
              <input
                name="from"
                type="date"
                required
                defaultValue={range.fromStr}
                className="mt-1 block rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-stone-600">
              止
              <input
                name="to"
                type="date"
                required
                defaultValue={range.toStr}
                className="mt-1 block rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
            >
              应用
            </button>
          </form>
        ) : (
          <p className="mt-3 text-xs text-stone-500">
            统计区间（UTC）：{range.fromStr} ~ {range.toStr}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-stone-900">经营账本</h2>
        <p className="mb-4 text-sm text-stone-500">
          按付款成功订单汇总。净收入 ≈ 订单实收 − 已退款（未扣支付通道手续费）。
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="有效订单数"
            value={String(summary.orderCount)}
            hint={
              summary.cancelledCount
                ? `同期取消 ${summary.cancelledCount} 单`
                : undefined
            }
          />
          <StatCard label="商品成交额" value={formatPrice(summary.subtotal)} />
          <StatCard label="优惠合计" value={formatPrice(summary.discountAmount)} />
          <StatCard label="运费合计" value={formatPrice(summary.shippingFee)} />
          <StatCard label="税费合计" value={formatPrice(summary.taxAmount)} />
          <StatCard label="订单实收" value={formatPrice(summary.total)} />
          <StatCard label="已退款" value={formatPrice(summary.refundedAmount)} />
          <StatCard
            label="净收入（约）"
            value={formatPrice(summary.netRevenue)}
            hint="实收 − 已退款"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-4 py-3 text-sm font-medium text-stone-700">
            本周期订单（最多 200）
          </div>
          {orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-stone-500">该周期暂无订单</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-left text-stone-600">
                <tr>
                  <th className="px-4 py-2 font-medium">订单</th>
                  <th className="px-4 py-2 font-medium">支付</th>
                  <th className="px-4 py-2 font-medium">总额</th>
                  <th className="px-4 py-2 font-medium">已退</th>
                  <th className="px-4 py-2 font-medium">状态</th>
                  <th className="px-4 py-2 font-medium">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-amber-800 hover:underline"
                      >
                        {formatOrderId(o.id)}
                      </Link>
                      <p className="text-xs text-stone-400">{o.email}</p>
                    </td>
                    <td className="px-4 py-2 uppercase text-stone-600">
                      {o.paymentMethod}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {formatPrice(o.total)}
                    </td>
                    <td className="px-4 py-2 text-stone-600">
                      {o.refundedAmount > 0
                        ? formatPrice(o.refundedAmount)
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-stone-600">
                      {ORDER_STATUS_LABELS[
                        o.status as keyof typeof ORDER_STATUS_LABELS
                      ] ?? o.status}
                    </td>
                    <td className="px-4 py-2 text-stone-500">
                      {o.createdAt.toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              推广提成结算台
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              提成按「商品小计 − 优惠」计（不含运费与税）。人工打款后标记已打款。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/commissions"
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            >
              查看提成明细
            </Link>
            <button
              type="button"
              disabled={pending || approvedIds.length === 0}
              onClick={() => {
                if (
                  !window.confirm(
                    `将本周期 ${approvedIds.length} 笔「可结算」提成（合计 ${formatPrice(approvedTotal)}）标记为已打款？`,
                  )
                ) {
                  return;
                }
                startTransition(async () => {
                  await markApprovedCommissionsPaidAction(approvedIds);
                  router.refresh();
                });
              }}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
            >
              {pending
                ? "处理中..."
                : `本页可结算全部标为已打款（${approvedIds.length}）`}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {payouts.length === 0 ? (
            <p className="p-6 text-center text-sm text-stone-500">
              该周期暂无提成记录
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-left text-stone-600">
                <tr>
                  <th className="px-4 py-2 font-medium">推广员</th>
                  <th className="px-4 py-2 font-medium">待结算</th>
                  <th className="px-4 py-2 font-medium">可结算</th>
                  <th className="px-4 py-2 font-medium">已打款</th>
                  <th className="px-4 py-2 font-medium">已作废</th>
                  <th className="px-4 py-2 font-medium">笔数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payouts.map((p) => (
                  <tr key={p.affiliateId}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">{p.name}</p>
                      <p className="font-mono text-xs text-stone-500">{p.code}</p>
                    </td>
                    <td className="px-4 py-3">{formatPrice(p.pending)}</td>
                    <td className="px-4 py-3 font-semibold text-amber-800">
                      {formatPrice(p.approved)}
                    </td>
                    <td className="px-4 py-3 text-emerald-700">
                      {formatPrice(p.paid)}
                    </td>
                    <td className="px-4 py-3 text-stone-400">
                      {formatPrice(p.voided)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
