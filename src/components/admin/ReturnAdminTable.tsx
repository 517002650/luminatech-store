"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setReturnRequestStatusAction } from "@/app/admin/actions";

type Row = {
  id: string;
  orderId: string;
  orderLabel: string;
  email: string;
  reason: string;
  details: string;
  status: string;
  createdAt: Date | string;
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

  function onStatus(id: string, status: string) {
    if (status === "refunded") {
      const ok = window.confirm(
        "确认为「已退款」？将自动执行 Stripe 退款（如适用）、回库存并取消订单。",
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
        将状态改为「已退款」会自动调用 Stripe 退款并恢复库存（订单变为已取消）。
      </p>
      {rows.map((row) => (
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
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">{row.details}</p>
              ) : null}
              <p className="mt-2 text-xs text-stone-400">
                {new Date(row.createdAt).toLocaleString("zh-CN")} ·{" "}
                {STATUS_LABEL[row.status] ?? row.status}
              </p>
            </div>
            <select
              value={row.status}
              disabled={pending || row.status === "refunded"}
              onChange={(e) => onStatus(row.id, e.target.value)}
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
      ))}
    </div>
  );
}
