import { AdminShell } from "@/components/admin/AdminShell";
import { TeamAdminPanel } from "@/components/admin/TeamAdminPanel";
import { requireOwner } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export default async function AdminTeamPage() {
  const admin = await requireOwner();

  const rows = await prisma.adminAccount.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      totpEnabled: true,
      createdAt: true,
    },
  });

  return (
    <AdminShell
      title="团队账号"
      subtitle="仅 Owner 可管理后台管理员与重置他人 2FA"
      admin={admin}
    >
      <TeamAdminPanel
        currentAdminId={admin.id}
        members={rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </AdminShell>
  );
}
