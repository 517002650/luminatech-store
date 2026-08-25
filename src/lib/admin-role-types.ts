import { prisma } from "@/lib/db";
import {
  DEFAULT_ADMIN_PERMISSIONS,
  OWNER_PERMISSIONS,
  parsePermissionsJson,
  serializePermissions,
  type AdminPermission,
} from "@/lib/admin-permissions";

/** Ensure system Owner/Admin role types exist and backfill roleTypeId on accounts. */
export async function ensureAdminRoleTypes() {
  const ownerPerms = serializePermissions(OWNER_PERMISSIONS);
  const adminPerms = serializePermissions(DEFAULT_ADMIN_PERMISSIONS);

  const owner = await prisma.adminRoleType.upsert({
    where: { key: "owner" },
    create: {
      key: "owner",
      name: "Owner",
      description: "超级管理员：全部模块与团队管理（权限不可改）",
      isSystem: true,
      permissions: ownerPerms,
    },
    update: {
      name: "Owner",
      isSystem: true,
      permissions: ownerPerms,
    },
  });

  const existingAdmin = await prisma.adminRoleType.findUnique({
    where: { key: "admin" },
  });

  const admin = existingAdmin
    ? await prisma.adminRoleType.update({
        where: { key: "admin" },
        data: {
          name: existingAdmin.name || "Admin",
          isSystem: true,
          // Keep Owner-customized permissions; only fill if empty/unset
          permissions:
            parsePermissionsJson(existingAdmin.permissions).length > 0
              ? existingAdmin.permissions
              : adminPerms,
        },
      })
    : await prisma.adminRoleType.create({
        data: {
          key: "admin",
          name: "Admin",
          description:
            "默认运营账号：不含运费设置、媒体清理、数据备份与团队管理",
          isSystem: true,
          permissions: adminPerms,
        },
      });

  // Backfill accounts missing roleTypeId
  const unbound = await prisma.adminAccount.findMany({
    where: { roleTypeId: null },
    select: { id: true, role: true },
  });

  for (const row of unbound) {
    const typeId = row.role === "owner" ? owner.id : admin.id;
    const roleKey = row.role === "owner" ? "owner" : row.role === "admin" ? "admin" : row.role;
    const matched =
      roleKey === "owner"
        ? owner
        : roleKey === "admin"
          ? admin
          : await prisma.adminRoleType.findUnique({ where: { key: roleKey } });

    await prisma.adminAccount.update({
      where: { id: row.id },
      data: {
        roleTypeId: matched?.id ?? typeId,
        role: matched?.key ?? (row.role === "owner" ? "owner" : "admin"),
      },
    });
  }

  return { owner, admin };
}

export async function getRoleTypePermissions(
  roleTypeId: string | null | undefined,
  fallbackRole: string,
): Promise<{ key: string; permissions: AdminPermission[]; isOwner: boolean }> {
  if (fallbackRole === "owner") {
    return { key: "owner", permissions: OWNER_PERMISSIONS, isOwner: true };
  }

  if (roleTypeId) {
    const rt = await prisma.adminRoleType.findUnique({
      where: { id: roleTypeId },
      select: { key: true, permissions: true },
    });
    if (rt) {
      if (rt.key === "owner") {
        return { key: "owner", permissions: OWNER_PERMISSIONS, isOwner: true };
      }
      return {
        key: rt.key,
        permissions: parsePermissionsJson(rt.permissions),
        isOwner: false,
      };
    }
  }

  const byKey = await prisma.adminRoleType.findUnique({
    where: { key: fallbackRole || "admin" },
    select: { key: true, permissions: true },
  });
  if (byKey?.key === "owner") {
    return { key: "owner", permissions: OWNER_PERMISSIONS, isOwner: true };
  }
  if (byKey) {
    return {
      key: byKey.key,
      permissions: parsePermissionsJson(byKey.permissions),
      isOwner: false,
    };
  }

  return {
    key: "admin",
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    isOwner: false,
  };
}

export function slugifyRoleTypeKey(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  const ascii = base.replace(/[^\w]/g, "") || "role";
  return `custom_${ascii}_${Date.now().toString(36).slice(-4)}`;
}
