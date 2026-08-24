"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  formatOrderId,
  type OrderStatus,
} from "@/lib/orders";

type OrderRow = {
  id: string;
  email: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: Date;
  itemCount: number;
};

export function OrderTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
        <p className="text-stone-600">暂无订单，客户完成支付后会出现在这里。</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">订单号</th>
              <th className="px-4 py-3 font-medium">邮箱</th>
              <th className="px-4 py-3 font-medium">金额</th>
              <th className="px-4 py-3 font-medium">商品数</th>
              <th className="px-4 py-3 font-medium">支付</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-4 font-mono font-medium">
                  #{formatOrderId(order.id)}
                </td>
                <td className="px-4 py-4 text-stone-600">
                  {order.email || "—"}
                </td>
                <td className="px-4 py-4 font-medium">{formatPrice(order.total)}</td>
                <td className="px-4 py-4">{order.itemCount}</td>
                <td className="px-4 py-4 capitalize">{order.paymentMethod}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status as OrderStatus} />
                </td>
                <td className="px-4 py-4 text-stone-500">
                  {new Date(order.createdAt).toLocaleString("zh-CN")}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
                  >
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    paid: "bg-blue-100 text-blue-700",
    processing: "bg-amber-100 text-amber-700",
    shipped: "bg-indigo-100 text-indigo-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-stone-100 text-stone-600",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.paid}`}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
