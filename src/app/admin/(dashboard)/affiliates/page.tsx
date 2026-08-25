import { AdminShell } from "@/components/admin/AdminShell";
import {
  AffiliateNewLink,
  AffiliateTable,
} from "@/components/admin/AffiliateTable";
import { AffiliateProgramSettingsForm } from "@/components/admin/AffiliateProgramSettingsForm";
import { getSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/db";

export default async function AdminAffiliatesPage() {
  const [affiliates, settings] = await Promise.all([
    prisma.affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        _count: { select: { commissions: true, orders: true } },
      },
    }),
    getSiteSettings(),
  ]);

  return (
    <AdminShell
      title="推广员"
      subtitle="绑定前台用户：对方用普通账号登录即可查看推广链接与提成结算状态"
    >
      <AffiliateProgramSettingsForm settings={settings} />
      <div className="mb-4 flex justify-end">
        <AffiliateNewLink />
      </div>
      <AffiliateTable affiliates={affiliates} />
    </AdminShell>
  );
}
