import Link from "next/link";
import { Download } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderTable } from "@/components/admin/OrderTable";
import { prisma } from "@/lib/db";
import { parseOrderItems } from "@/lib/orders";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((order) => ({
    id: order.id,
    email: order.email,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    itemCount: parseOrderItems(order.items).reduce(
      (sum, item) => sum + item.quantity,
      0,
    ),
  }));

  return (
    <AdminShell title="订单管理" subtitle="查看客户订单、导出 Excel、更新状态并自动发送发货邮件">
      <div className="mb-4 flex justify-end">
        <a
          href="/api/admin/orders/export"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          <Download className="h-4 w-4" />
          导出 Excel
        </a>
      </div>
      <OrderTable orders={rows} />
      <p className="mt-4 text-xs text-stone-500">
        将订单状态改为「已发货」时，若客户留有邮箱且已配置 SMTP，将自动发送发货通知邮件。
      </p>
    </AdminShell>
  );
}
