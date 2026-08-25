"use client";

import { setCommissionStatusAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import {
  COMMISSION_STATUS_LABELS,
  type CommissionStatus,
} from "@/lib/affiliates";
import { formatOrderId } from "@/lib/orders";

type CommissionRow = {
  id: string;
  amount: number;
  baseAmount: number;
  rate: number;
  status: string;
  createdAt: Date;
  affiliate: { code: string; name: string };
  order: { id: string; email: string; total: number; status: string };
};

export function CommissionTable({ rows }: { rows: CommissionRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
        暂无提成记录。买家通过推广链接下单并付款后会出现在这里。
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-600">
          <tr>
            <th className="px-4 py-3 font-medium">时间</th>
            <th className="px-4 py-3 font-medium">推广员</th>
            <th className="px-4 py-3 font-medium">订单</th>
            <th className="px-4 py-3 font-medium">计佣基数</th>
            <th className="px-4 py-3 font-medium">提成</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row) => {
            const status = row.status as CommissionStatus;
            return (
              <tr key={row.id}>
                <td className="px-4 py-3 text-stone-500">
                  {row.createdAt.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.affiliate.name}</p>
                  <p className="font-mono text-xs text-stone-500">
                    {row.affiliate.code}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/admin/orders/${row.order.id}`}
                    className="font-mono text-amber-800 hover:underline"
                  >
                    #{formatOrderId(row.order.id)}
                  </a>
                  <p className="text-xs text-stone-500">{row.order.email}</p>
                </td>
                <td className="px-4 py-3">
                  {formatPrice(row.baseAmount)}
                  <span className="text-xs text-stone-400"> × {row.rate}%</span>
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatPrice(row.amount)}
                </td>
                <td className="px-4 py-3">
                  {COMMISSION_STATUS_LABELS[status] ?? row.status}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {status === "pending" ? (
                      <StatusButton id={row.id} status="approved" label="标记可结算" />
                    ) : null}
                    {status === "approved" ? (
                      <StatusButton id={row.id} status="paid" label="标记已打款" />
                    ) : null}
                    {status === "pending" || status === "approved" ? (
                      <StatusButton id={row.id} status="void" label="作废" />
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusButton({
  id,
  status,
  label,
}: {
  id: string;
  status: "approved" | "paid" | "void";
  label: string;
}) {
  return (
    <form action={setCommissionStatusAction.bind(null, id, status)}>
      <button type="submit" className="text-stone-600 hover:underline">
        {label}
      </button>
    </form>
  );
}
