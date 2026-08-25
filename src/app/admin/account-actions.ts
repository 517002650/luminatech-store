"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  authenticateAdminPassword,
  clearAdminSession,
  clearPending2fa,
  clearTotpSetupSecret,
  countActiveOwners,
  createAdminAccount,
  getAdminAuthConfigError,
  getPending2faAdminId,
  getTotpSetupSecret,
  hasAnyAdmin,
  requireAdmin,
  requireOwner,
  setAdminSession,
  setPending2fa,
  setTotpSetupSecret,
  validateNewAdminPassword,
  verifyBootstrapPassphrase,
} from "@/lib/admin-auth";
import {
  generateTotpSecret,
  totpQrDataUrl,
  verifyTotpToken,
} from "@/lib/admin-totp";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/user-auth";

function revalidateAdminAccountPaths() {
  revalidatePath("/admin/security");
  revalidatePath("/admin/team");
  revalidatePath("/admin/login");
}

export async function bootstrapOwnerAction(formData: FormData) {
  const configError = getAdminAuthConfigError();
  if (configError) return { error: configError };

  if (await hasAnyAdmin()) {
    return { error: "已完成初始化，请直接登录" };
  }

  const installPassword = String(formData.get("installPassword") ?? "");
  if (!verifyBootstrapPassphrase(installPassword)) {
    return { error: "安装口令错误（ADMIN_PASSWORD）" };
  }

  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  if (password !== password2) return { error: "两次密码不一致" };

  const result = await createAdminAccount({
    email,
    name,
    password,
    role: "owner",
  });
  if ("error" in result && result.error) return { error: result.error };

  try {
    const { ensureAdminRoleTypes } = await import("@/lib/admin-role-types");
    const { owner } = await ensureAdminRoleTypes();
    if (result.id) {
      await prisma.adminAccount.update({
        where: { id: result.id },
        data: { role: "owner", roleTypeId: owner.id },
      });
    }
  } catch (err) {
    console.error("ensureAdminRoleTypes after bootstrap:", err);
  }

  await setAdminSession(result.id!);
  redirect("/admin");
}

export async function loginAction(formData: FormData) {
  const configError = getAdminAuthConfigError();
  if (configError) return { error: configError };

  if (!(await hasAnyAdmin())) {
    return { error: "请先创建首个 Owner 账号" };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await authenticateAdminPassword(email, password);
  if ("error" in result && result.error) return { error: result.error };

  const admin = result.admin!;
  if (admin.totpEnabled && admin.totpSecret) {
    await setPending2fa(admin.id);
    return { need2fa: true as const };
  }

  await setAdminSession(admin.id);
  redirect("/admin");
}

export async function verifyTotpLoginAction(formData: FormData) {
  const adminId = await getPending2faAdminId();
  if (!adminId) return { error: "登录已过期，请重新输入密码" };

  const code = String(formData.get("code") ?? "");
  const row = await prisma.adminAccount.findUnique({ where: { id: adminId } });
  if (!row || !row.active || !row.totpEnabled || !row.totpSecret) {
    await clearPending2fa();
    return { error: "无法完成二次验证" };
  }

  if (!verifyTotpToken(row.totpSecret, code)) {
    return { error: "验证码错误" };
  }

  await setAdminSession(row.id);
  redirect("/admin");
}

export async function cancelTotpLoginAction() {
  await clearPending2fa();
  redirect("/admin/login");
}

export async function logoutAction() {
  await clearAdminSession();
  await clearTotpSetupSecret();
  redirect("/admin/login");
}

export async function changeOwnPasswordAction(formData: FormData) {
  const admin = await requireAdmin();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const next2 = String(formData.get("newPassword2") ?? "");

  if (next !== next2) return { error: "两次新密码不一致" };
  const pwdError = validateNewAdminPassword(next);
  if (pwdError) return { error: pwdError };

  const row = await prisma.adminAccount.findUnique({ where: { id: admin.id } });
  if (!row) return { error: "账号不存在" };

  if (!(await verifyPassword(current, row.passwordHash))) {
    return { error: "当前密码错误" };
  }

  await prisma.adminAccount.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(next) },
  });

  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function beginTotpSetupAction() {
  const admin = await requireAdmin();
  if (admin.totpEnabled) return { error: "已启用两步验证" };

  const secret = generateTotpSecret();
  await setTotpSetupSecret(admin.id, secret);
  const qrDataUrl = await totpQrDataUrl(admin.email, secret);
  return { success: true as const, secret, qrDataUrl };
}

export async function confirmTotpSetupAction(formData: FormData) {
  const admin = await requireAdmin();
  const code = String(formData.get("code") ?? "");
  const secret = await getTotpSetupSecret(admin.id);
  if (!secret) return { error: "设置已过期，请重新开始" };

  if (!verifyTotpToken(secret, code)) {
    return { error: "验证码错误，请确认 App 时间同步" };
  }

  await prisma.adminAccount.update({
    where: { id: admin.id },
    data: { totpSecret: secret, totpEnabled: true },
  });
  await clearTotpSetupSecret();
  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function disableTotpAction(formData: FormData) {
  const admin = await requireAdmin();
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "");

  const row = await prisma.adminAccount.findUnique({ where: { id: admin.id } });
  if (!row || !row.totpEnabled) return { error: "未启用两步验证" };

  if (!(await verifyPassword(password, row.passwordHash))) {
    return { error: "密码错误" };
  }
  if (row.totpSecret && !verifyTotpToken(row.totpSecret, code)) {
    return { error: "验证码错误" };
  }

  await prisma.adminAccount.update({
    where: { id: admin.id },
    data: { totpSecret: null, totpEnabled: false },
  });
  await clearTotpSetupSecret();
  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function createAdminAction(formData: FormData) {
  await requireOwner();

  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");
  const roleTypeId = String(formData.get("roleTypeId") ?? "").trim();

  if (!roleTypeId) return { error: "请选择账号类型" };

  const result = await createAdminAccount({
    email,
    name,
    password,
    roleTypeId,
  });
  if ("error" in result && result.error) return { error: result.error };

  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function setAdminActiveAction(id: string, active: boolean) {
  const me = await requireOwner();
  if (id === me.id && !active) return { error: "不能停用自己的账号" };

  const target = await prisma.adminAccount.findUnique({
    where: { id },
    include: { roleType: { select: { key: true } } },
  });
  if (!target) return { error: "账号不存在" };

  const isOwner =
    target.role === "owner" || target.roleType?.key === "owner";
  if (isOwner && target.active && !active) {
    const owners = await countActiveOwners();
    if (owners <= 1) return { error: "不能停用最后一个 Owner" };
  }

  await prisma.adminAccount.update({
    where: { id },
    data: { active },
  });
  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function resetAdminTotpAction(id: string) {
  const me = await requireOwner();
  if (id === me.id) {
    return { error: "请在「安全设置」中自行关闭两步验证" };
  }

  await prisma.adminAccount.update({
    where: { id },
    data: { totpSecret: null, totpEnabled: false },
  });
  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function updateAdminRoleAction(id: string, roleTypeId: string) {
  const me = await requireOwner();

  const target = await prisma.adminAccount.findUnique({
    where: { id },
    include: { roleType: { select: { key: true } } },
  });
  if (!target) return { error: "账号不存在" };

  const rt = await prisma.adminRoleType.findUnique({ where: { id: roleTypeId } });
  if (!rt) return { error: "账号类型不存在" };

  const wasOwner =
    target.role === "owner" || target.roleType?.key === "owner";
  const willBeOwner = rt.key === "owner";

  if (wasOwner && !willBeOwner) {
    const owners = await countActiveOwners();
    if (owners <= 1) return { error: "不能降级最后一个 Owner" };
  }

  if (id === me.id && !willBeOwner) {
    const owners = await countActiveOwners();
    if (owners <= 1) return { error: "不能降级最后一个 Owner" };
  }

  await prisma.adminAccount.update({
    where: { id },
    data: { role: rt.key, roleTypeId: rt.id },
  });
  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function createRoleTypeAction(formData: FormData) {
  await requireOwner();
  const { sanitizeAssignablePermissions, serializePermissions, isAdminPermission } =
    await import("@/lib/admin-permissions");
  const { slugifyRoleTypeKey } = await import("@/lib/admin-role-types");

  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  if (!name) return { error: "请填写类型名称" };

  const rawPerms = formData.getAll("permissions").map(String);
  const perms = sanitizeAssignablePermissions(
    rawPerms.filter(isAdminPermission),
  );
  // Always keep security for any staff type
  if (!perms.includes("security")) perms.push("security");

  const key = slugifyRoleTypeKey(name);
  await prisma.adminRoleType.create({
    data: {
      key,
      name,
      description: String(formData.get("description") ?? "").trim().slice(0, 200),
      isSystem: false,
      permissions: serializePermissions(perms),
    },
  });
  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function updateRoleTypePermissionsAction(
  id: string,
  formData: FormData,
) {
  await requireOwner();
  const {
    sanitizeAssignablePermissions,
    serializePermissions,
    isAdminPermission,
    OWNER_PERMISSIONS,
  } = await import("@/lib/admin-permissions");

  const rt = await prisma.adminRoleType.findUnique({ where: { id } });
  if (!rt) return { error: "类型不存在" };
  if (rt.key === "owner") return { error: "Owner 权限不可修改" };

  const name = String(formData.get("name") ?? rt.name).trim().slice(0, 40);
  const rawPerms = formData.getAll("permissions").map(String);
  let perms = sanitizeAssignablePermissions(
    rawPerms.filter(isAdminPermission),
  );
  if (!perms.includes("security")) perms.push("security");

  // Owner type forced full — already blocked above
  if (rt.key === "owner") {
    perms = [...OWNER_PERMISSIONS];
  }

  await prisma.adminRoleType.update({
    where: { id },
    data: {
      name: name || rt.name,
      description: String(formData.get("description") ?? rt.description)
        .trim()
        .slice(0, 200),
      permissions: serializePermissions(perms),
    },
  });
  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function deleteRoleTypeAction(id: string) {
  await requireOwner();
  const rt = await prisma.adminRoleType.findUnique({
    where: { id },
    include: { _count: { select: { accounts: true } } },
  });
  if (!rt) return { error: "类型不存在" };
  if (rt.isSystem) return { error: "系统内置类型不可删除" };
  if (rt._count.accounts > 0) {
    return { error: "仍有成员使用此类型，请先更换后再删除" };
  }

  await prisma.adminRoleType.delete({ where: { id } });
  revalidateAdminAccountPaths();
  return { success: true as const };
}
