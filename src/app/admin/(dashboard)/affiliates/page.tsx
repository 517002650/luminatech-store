import { AdminShell } from "@/components/admin/AdminShell";
import {
  AffiliateNewLink,
  AffiliateTable,
} from "@/components/admin/AffiliateTable";
import { prisma } from "@/lib/db";

export default async function AdminAffiliatesPage() {
  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      _count: { select: { commissions: true, orders: true } },
    },
  });

  return (
    <AdminShell
      title="推广员"
      subtitle="绑定前台用户：对方用普通账号登录即可查看推广链接与提成结算状态"
    >
      <div className="mb-4 flex justify-end">
        <AffiliateNewLink />
      </div>
      <AffiliateTable affiliates={affiliates} />
    </AdminShell>
  );
}
