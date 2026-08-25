import { AdminShell } from "@/components/admin/AdminShell";
import { TeamAdminPanel } from "@/components/admin/TeamAdminPanel";
import { requirePermission } from "@/lib/admin-auth";
import { parsePermissionsJson } from "@/lib/admin-permissions";
import { ensureAdminRoleTypes } from "@/lib/admin-role-types";
import { prisma } from "@/lib/db";

export default async function AdminTeamPage() {
  const admin = await requirePermission("team");
  await ensureAdminRoleTypes();

  const [rows, roleTypes] = await Promise.all([
    prisma.adminAccount.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleTypeId: true,
        active: true,
        totpEnabled: true,
        createdAt: true,
        roleType: { select: { name: true, key: true } },
      },
    }),
    prisma.adminRoleType.findMany({
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { accounts: true } } },
    }),
  ]);

  return (
    <AdminShell
      title="团队账号"
      subtitle="管理账号类型权限，并添加团队成员。默认 Admin 不能访问运费 / 媒体 / 备份。"
      admin={admin}
    >
      <TeamAdminPanel
        currentAdminId={admin.id}
        roleTypes={roleTypes.map((rt) => ({
          id: rt.id,
          key: rt.key,
          name: rt.name,
          description: rt.description,
          isSystem: rt.isSystem,
          permissions: parsePermissionsJson(rt.permissions),
          accountCount: rt._count.accounts,
        }))}
        members={rows.map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          roleTypeId: r.roleTypeId,
          roleTypeName: r.roleType?.name ?? r.role,
          active: r.active,
          totpEnabled: r.totpEnabled,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </AdminShell>
  );
}
