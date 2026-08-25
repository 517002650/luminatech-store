"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setReturnRequestStatusAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

type ReturnLine = {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  nameZh?: string;
  nameEn?: string;
};

type Row = {
  id: string;
  orderId: string;
  orderLabel: string;
  email: string;
  reason: string;
  details: string;
  status: string;
  createdAt: Date | string;
  lines: ReturnLine[];
};

const STATUSES = ["requested", "approved", "rejected", "received", "refunded"] as const;

const STATUS_LABEL: Record<string, string> = {
  requested: "已申请",
  approved: "已批准",
  rejected: "已拒绝",
  received: "已收货",
  refunded: "已退款",
};

export function ReturnAdminTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onStatus(id: string, status: string, lineCount: number) {
    if (status === "refunded") {
      const ok = window.confirm(
        lineCount > 0
          ? "确认为「已退款」？将按所选行退款并回补对应库存；若覆盖整单则取消订单。"
          : "确认为「已退款」？将自动退款（如适用）、回库存并取消订单。",
      );
      if (!ok) {
        router.refresh();
        return;
      }
    }

    setError("");
    startTransition(async () => {
      const result = await setReturnRequestStatusAction(id, status);
      if (result && "error" in result && result.error) {
        setError(
          result.error === "invalid_status"
            ? "无效状态"
            : String(result.error),
        );
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
        暂无退货申请
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <p className="text-sm text-stone-500">
        改为「已退款」会按申请行退款并回库存；整单则取消订单。需具备退款记账或 Stripe 退款权限。
      </p>
      {rows.map((row) => {
        const merch = row.lines.reduce((n, l) => n + l.price * l.quantity, 0);
        return (
          <article
            key={row.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-500">
                  订单 #{row.orderLabel} · {row.email}
                </p>
                <h3 className="mt-1 font-semibold text-stone-900">{row.reason}</h3>
                {row.details ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">
                    {row.details}
                  </p>
                ) : null}
                {row.lines.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-stone-700">
                    {row.lines.map((l) => (
                      <li
                        key={`${l.productId}-${l.variantId ?? ""}-${l.quantity}`}
                      >
                        {(l.nameZh || l.nameEn || l.productId) +
                          ` × ${l.quantity} · ${formatPrice(l.price * l.quantity)}`}
                      </li>
                    ))}
                    <li className="font-medium text-stone-900">
                      行商品合计约 {formatPrice(merch)}
                    </li>
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-stone-500">整单退货（旧数据）</p>
                )}
                <p className="mt-2 text-xs text-stone-400">
                  {new Date(row.createdAt).toLocaleString("zh-CN")} ·{" "}
                  {STATUS_LABEL[row.status] ?? row.status}
                </p>
              </div>
              <select
                value={row.status}
                disabled={pending || row.status === "refunded"}
                onChange={(e) => onStatus(row.id, e.target.value, row.lines.length)}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 disabled:opacity-60"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <a
              href={`/admin/orders/${row.orderId}`}
              className="mt-3 inline-block text-sm text-amber-700 hover:underline"
            >
              查看订单 →
            </a>
          </article>
        );
      })}
    </div>
  );
}
