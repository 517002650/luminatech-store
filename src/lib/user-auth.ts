import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sessionCookieSecure } from "@/lib/session-cookie";

const COOKIE_NAME = "user_session";

function getSecret() {
  return (
    process.env.USER_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "change-user-session-in-production"
  );
}

function signUserId(userId: string) {
  const sig = createHmac("sha256", getSecret()).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

function parseUserId(token: string) {
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSecret()).update(userId).digest("hex");
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return userId;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function setUserSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signUserId(userId), {
    httpOnly: true,
    sameSite: "lax",
    // Must follow ADMIN_COOKIE_SECURE — Secure cookies are dropped on http://HK_IP
    secure: sessionCookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = parseUserId(token);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      bannedFromReviews: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}
