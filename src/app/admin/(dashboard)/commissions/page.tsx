import { AdminShell } from "@/components/admin/AdminShell";
import { CommissionTable } from "@/components/admin/CommissionTable";
import { prisma } from "@/lib/db";

export default async function AdminCommissionsPage() {
  const rows = await prisma.commission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      affiliate: { select: { code: true, name: true } },
      order: { select: { id: true, email: true, total: true, status: true } },
    },
  });

  return (
    <AdminShell
      title="推广提成"
      subtitle="付款后待结算；订单完成后可结算；全额退款自动作废。人工打款后点「已打款」。"
    >
      <CommissionTable rows={rows} />
    </AdminShell>
  );
}
