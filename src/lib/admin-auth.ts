import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const WEAK_PASSWORDS = new Set([
  "admin123",
  "password",
  "123456",
  "12345678",
  "change-me-in-production",
]);

function isProductionLike() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.FORCE_SECURE_ADMIN === "true"
  );
}

/** Non-null when admin login must be blocked until env is fixed. */
export function getAdminPasswordConfigError(): string | null {
  const pwd = process.env.ADMIN_PASSWORD?.trim() ?? "";

  if (isProductionLike()) {
    if (!pwd) {
      return "未配置 ADMIN_PASSWORD。生产环境已禁用默认口令 admin123，请在 Vercel 环境变量中设置强密码（至少 12 位）。";
    }
    if (WEAK_PASSWORDS.has(pwd) || pwd.length < 12) {
      return "ADMIN_PASSWORD 过弱。生产环境要求至少 12 位，且不能使用 admin123 等常见弱口令。";
    }
  }

  return null;
}

function getSecret() {
  if (process.env.ADMIN_SECRET?.trim()) {
    return process.env.ADMIN_SECRET.trim();
  }
  const pwd = process.env.ADMIN_PASSWORD?.trim();
  if (pwd && !WEAK_PASSWORDS.has(pwd)) {
    return pwd;
  }
  if (isProductionLike()) {
    // Sessions signed with this will not validate once a real secret is set.
    return "missing-admin-secret-refusing-weak-fallback";
  }
  return "change-me-in-production";
}

export function createSessionToken() {
  return createHmac("sha256", getSecret()).update("admin-authenticated").digest("hex");
}

export async function isAdminAuthenticated() {
  // Always touch cookies so this route stays dynamic (avoids static prerender of admin pages).
  const cookieStore = await cookies();

  if (getAdminPasswordConfigError()) return false;

  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = createSessionToken();
  if (token.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function verifyAdminPassword(password: string) {
  if (getAdminPasswordConfigError()) return false;

  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    // Local / non-production only: allow temporary default.
    return password === "admin123";
  }
  return password === expected;
}
