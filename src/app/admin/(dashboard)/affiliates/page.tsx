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
      _count: { select: { commissions: true, orders: true } },
    },
  });

  return (
    <AdminShell
      title="推广员"
      subtitle="链接推广：分享专属链接，买家 30 天内下单并付款后产生提成"
    >
      <div className="mb-4 flex justify-end">
        <AffiliateNewLink />
      </div>
      <AffiliateTable affiliates={affiliates} />
    </AdminShell>
  );
}
