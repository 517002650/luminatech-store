import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getCurrentAdmin,
  hasPermission,
  isAdminAuthenticated,
  type AdminSession,
} from "@/lib/admin-auth";
import {
  NAV_PERMISSION,
  permissionForAdminPath,
  type AdminPermission,
} from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

function firstAllowedAdminPath(admin: AdminSession): string {
  for (const [href, perm] of Object.entries(NAV_PERMISSION) as [
    string,
    AdminPermission,
  ][]) {
    if (hasPermission(admin, perm)) return href;
  }
  return "/admin/security";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  try {
    const { ensureAdminRoleTypes } = await import("@/lib/admin-role-types");
    await ensureAdminRoleTypes();
  } catch (err) {
    console.error("ensureAdminRoleTypes:", err);
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const needed = permissionForAdminPath(pathname);
  if (needed) {
    const admin = await getCurrentAdmin();
    if (admin && !hasPermission(admin, needed)) {
      redirect(firstAllowedAdminPath(admin));
    }
  }

  return children;
}
