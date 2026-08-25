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
  type AdminRole,
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
  const roleRaw = String(formData.get("role") ?? "admin");
  const role: AdminRole = roleRaw === "owner" ? "owner" : "admin";

  const result = await createAdminAccount({ email, name, password, role });
  if ("error" in result && result.error) return { error: result.error };

  revalidateAdminAccountPaths();
  return { success: true as const };
}

export async function setAdminActiveAction(id: string, active: boolean) {
  const me = await requireOwner();
  if (id === me.id && !active) return { error: "不能停用自己的账号" };

  const target = await prisma.adminAccount.findUnique({ where: { id } });
  if (!target) return { error: "账号不存在" };

  if (target.role === "owner" && target.active && !active) {
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

export async function updateAdminRoleAction(id: string, role: AdminRole) {
  const me = await requireOwner();
  if (role !== "owner" && role !== "admin") return { error: "无效角色" };

  const target = await prisma.adminAccount.findUnique({ where: { id } });
  if (!target) return { error: "账号不存在" };

  if (target.role === "owner" && role === "admin") {
    const owners = await countActiveOwners();
    if (owners <= 1) return { error: "不能降级最后一个 Owner" };
  }

  if (id === me.id && role === "admin") {
    const owners = await countActiveOwners();
    if (owners <= 1) return { error: "不能降级最后一个 Owner" };
  }

  await prisma.adminAccount.update({
    where: { id },
    data: { role },
  });
  revalidateAdminAccountPaths();
  return { success: true as const };
}
