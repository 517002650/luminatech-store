import { AdminShell } from "@/components/admin/AdminShell";
import { ReturnAdminTable } from "@/components/admin/ReturnAdminTable";
import { formatOrderId } from "@/lib/orders";
import { prisma } from "@/lib/db";

export default async function AdminReturnsPage() {
  const rows = await prisma.returnRequest.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  const openCount = rows.filter((r) =>
    ["requested", "approved", "received"].includes(r.status),
  ).length;

  return (
    <AdminShell
      title="退货申请"
      subtitle={
        openCount > 0
          ? `${openCount} 条进行中 · 买家从订单详情发起`
          : "买家可在已发货/已完成订单详情申请退货"
      }
    >
      <ReturnAdminTable
        rows={rows.map((r) => ({
          id: r.id,
          orderId: r.orderId,
          orderLabel: formatOrderId(r.orderId),
          email: r.email,
          reason: r.reason,
          details: r.details,
          status: r.status,
          createdAt: r.createdAt,
        }))}
      />
    </AdminShell>
  );
}
