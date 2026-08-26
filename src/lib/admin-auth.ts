import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/user-auth";
import {
  DEFAULT_ADMIN_PERMISSIONS,
  OWNER_PERMISSIONS,
  type AdminPermission,
} from "@/lib/admin-permissions";
import { getRoleTypePermissions } from "@/lib/admin-role-types";
import { sessionCookieSecure } from "@/lib/session-cookie";

const COOKIE_NAME = "admin_session";
const PENDING_2FA_COOKIE = "admin_2fa_pending";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const PENDING_2FA_MAX_AGE = 60 * 5;

const WEAK_PASSWORDS = new Set([
  "admin123",
  "password",
  "123456",
  "12345678",
  "change-me-in-production",
]);

/** @deprecated Prefer roleType key; kept for Owner checks. */
export type AdminRole = "owner" | "admin";

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  /** Role type key: owner | admin | custom_* */
  role: string;
  roleTypeId: string | null;
  permissions: AdminPermission[];
  totpEnabled: boolean;
};

export function isOwnerSession(admin: Pick<AdminSession, "role">) {
  return admin.role === "owner";
}

export function hasPermission(
  admin: Pick<AdminSession, "role" | "permissions">,
  permission: AdminPermission,
) {
  if (admin.role === "owner") return true;
  return admin.permissions.includes(permission);
}

function isProductionLike() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.FORCE_SECURE_ADMIN === "true"
  );
}

export function isWeakAdminPassword(password: string) {
  return WEAK_PASSWORDS.has(password) || password.length < 12;
}

/** Session signing secret — prefer ADMIN_SECRET. */
function getSecret() {
  if (process.env.ADMIN_SECRET?.trim()) {
    return process.env.ADMIN_SECRET.trim();
  }
  const pwd = process.env.ADMIN_PASSWORD?.trim();
  if (pwd && !WEAK_PASSWORDS.has(pwd)) {
    return pwd;
  }
  if (isProductionLike()) {
    return "missing-admin-secret-refusing-weak-fallback";
  }
  return "change-me-in-production";
}

/**
 * Blocks login/bootstrap when production cannot safely sign sessions.
 * After AdminAccount exists, ADMIN_PASSWORD is no longer required for login.
 */
export function getAdminAuthConfigError(): string | null {
  if (!isProductionLike()) return null;

  const secret = process.env.ADMIN_SECRET?.trim() ?? "";
  const pwd = process.env.ADMIN_PASSWORD?.trim() ?? "";

  if (secret.length >= 16) return null;
  if (pwd && !WEAK_PASSWORDS.has(pwd) && pwd.length >= 12) return null;

  return "未配置可用的会话签名密钥。请设置 ADMIN_SECRET（推荐，≥16 位）或强 ADMIN_PASSWORD（≥12 位）。";
}

/** @deprecated use getAdminAuthConfigError */
export function getAdminPasswordConfigError(): string | null {
  return getAdminAuthConfigError();
}

function signId(id: string, purpose: string) {
  const sig = createHmac("sha256", getSecret())
    .update(`${purpose}:${id}`)
    .digest("hex");
  return `${id}.${sig}`;
}

function parseSignedId(token: string, purpose: string): string | null {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSecret())
    .update(`${purpose}:${id}`)
    .digest("hex");
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: sessionCookieSecure(),
    path: "/",
    maxAge,
  };
}

export async function hasAnyAdmin(): Promise<boolean> {
  const count = await prisma.adminAccount.count();
  return count > 0;
}

export async function countActiveOwners(): Promise<number> {
  return prisma.adminAccount.count({
    where: {
      active: true,
      OR: [{ role: "owner" }, { roleType: { key: "owner" } }],
    },
  });
}

/** Install passphrase for bootstrap only (env ADMIN_PASSWORD or local admin123). */
export function verifyBootstrapPassphrase(password: string): boolean {
  if (getAdminAuthConfigError()) return false;
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    return !isProductionLike() && password === "admin123";
  }
  if (isProductionLike() && isWeakAdminPassword(expected)) return false;
  return password === expected;
}

/** @deprecated env password login removed after multi-admin */
export function verifyAdminPassword(password: string) {
  return verifyBootstrapPassphrase(password);
}

export async function setAdminSession(adminId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signId(adminId, "session"), cookieOptions(SESSION_MAX_AGE));
  cookieStore.delete(PENDING_2FA_COOKIE);
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(PENDING_2FA_COOKIE);
}

export async function setPending2fa(adminId: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    PENDING_2FA_COOKIE,
    signId(adminId, "2fa-pending"),
    cookieOptions(PENDING_2FA_MAX_AGE),
  );
}

export async function clearPending2fa() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_2FA_COOKIE);
}

const TOTP_SETUP_COOKIE = "admin_totp_setup";
const TOTP_SETUP_MAX_AGE = 60 * 10;

export async function setTotpSetupSecret(adminId: string, secret: string) {
  const cookieStore = await cookies();
  const payload = `${adminId}.${secret}`;
  const sig = createHmac("sha256", getSecret()).update(`totp-setup:${payload}`).digest("hex");
  cookieStore.set(TOTP_SETUP_COOKIE, `${payload}.${sig}`, cookieOptions(TOTP_SETUP_MAX_AGE));
}

export async function getTotpSetupSecret(
  expectedAdminId: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOTP_SETUP_COOKIE)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 3) return null;
  const sig = parts.pop()!;
  const secret = parts.pop()!;
  const adminId = parts.join(".");
  if (adminId !== expectedAdminId) return null;
  const payload = `${adminId}.${secret}`;
  const expected = createHmac("sha256", getSecret())
    .update(`totp-setup:${payload}`)
    .digest("hex");
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return secret;
}

export async function clearTotpSetupSecret() {
  const cookieStore = await cookies();
  cookieStore.delete(TOTP_SETUP_COOKIE);
}

export async function getPending2faAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_2FA_COOKIE)?.value;
  if (!token) return null;
  return parseSignedId(token, "2fa-pending");
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  // Always touch cookies so admin routes stay dynamic.
  void cookieStore;

  if (getAdminAuthConfigError()) return null;

  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const adminId = parseSignedId(token, "session");
  if (!adminId) return null;

  const row = await prisma.adminAccount.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      roleTypeId: true,
      active: true,
      totpEnabled: true,
    },
  });

  if (!row || !row.active) return null;

  let resolved;
  try {
    resolved = await getRoleTypePermissions(row.roleTypeId, row.role);
  } catch {
    // Schema not migrated yet — fall back to legacy roles
    resolved =
      row.role === "owner"
        ? { key: "owner", permissions: OWNER_PERMISSIONS, isOwner: true }
        : { key: "admin", permissions: DEFAULT_ADMIN_PERMISSIONS, isOwner: false };
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: resolved.key,
    roleTypeId: row.roleTypeId,
    permissions: resolved.isOwner ? OWNER_PERMISSIONS : resolved.permissions,
    totpEnabled: row.totpEnabled,
  };
}

export async function isAdminAuthenticated() {
  return (await getCurrentAdmin()) != null;
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireOwner(): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") redirect("/admin");
  return admin;
}

export async function requirePermission(
  permission: AdminPermission,
): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (!hasPermission(admin, permission)) redirect("/admin");
  return admin;
}

/** For API routes: null if missing permission. */
export async function getAdminWithPermission(
  permission: AdminPermission,
): Promise<AdminSession | null> {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin, permission)) return null;
  return admin;
}

export function validateNewAdminPassword(password: string): string | null {
  if (password.length < 12) return "密码至少 12 位";
  if (WEAK_PASSWORDS.has(password)) return "密码过弱，请更换";
  return null;
}

export async function createAdminAccount(input: {
  email: string;
  name: string;
  password: string;
  role?: AdminRole | string;
  roleTypeId?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "请填写有效邮箱" as const };
  }
  const pwdError = validateNewAdminPassword(input.password);
  if (pwdError) return { error: pwdError };

  const existing = await prisma.adminAccount.findUnique({ where: { email } });
  if (existing) return { error: "该邮箱已存在" as const };

  let roleKey = (input.role ?? "admin").trim() || "admin";
  let roleTypeId = input.roleTypeId ?? null;

  if (roleTypeId) {
    const rt = await prisma.adminRoleType.findUnique({ where: { id: roleTypeId } });
    if (!rt) return { error: "账号类型不存在" as const };
    roleKey = rt.key;
  } else {
    const rt = await prisma.adminRoleType.findUnique({ where: { key: roleKey } });
    if (rt) roleTypeId = rt.id;
  }

  const row = await prisma.adminAccount.create({
    data: {
      email,
      name: input.name.trim().slice(0, 80),
      passwordHash: await hashPassword(input.password),
      role: roleKey,
      roleTypeId,
      active: true,
    },
  });
  return { success: true as const, id: row.id };
}

export async function authenticateAdminPassword(
  email: string,
  password: string,
) {
  const normalized = email.trim().toLowerCase();
  const row = await prisma.adminAccount.findUnique({ where: { email: normalized } });
  if (!row || !row.active) return { error: "邮箱或密码错误" as const };

  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) return { error: "邮箱或密码错误" as const };

  return {
    success: true as const,
    admin: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      totpEnabled: row.totpEnabled,
      totpSecret: row.totpSecret,
    },
  };
}

/** Legacy no-arg session setter — do not use. */
export async function createSessionToken() {
  return "";
}
