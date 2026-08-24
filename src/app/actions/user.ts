"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  clearUserSession,
  getCurrentUser,
  hashPassword,
  setUserSession,
  verifyPassword,
} from "@/lib/user-auth";

export async function registerUserAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/account/orders");

  if (!email || !password) {
    return { error: "请填写邮箱和密码" };
  }
  if (password.length < 6) {
    return { error: "密码至少 6 位" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "该邮箱已注册，请直接登录" };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
    },
  });

  await setUserSession(user.id);
  redirect(redirectTo);
}

export async function loginUserAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/account/orders");

  if (!email || !password) {
    return { error: "请填写邮箱和密码" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "邮箱或密码错误" };
  }

  await setUserSession(user.id);
  redirect(redirectTo);
}

export async function logoutUserAction() {
  await clearUserSession();
  redirect("/");
}

export async function toggleWishlistAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "login_required" as const };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { wishlisted: false };
  }

  await prisma.wishlistItem.create({
    data: { userId: user.id, productId },
  });
  revalidatePath("/account/wishlist");
  return { wishlisted: true };
}

export async function submitReviewAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "login_required" as const };
  }

  const productId = String(formData.get("productId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!productId || rating < 1 || rating > 5 || !title || !content) {
    return { error: "请完整填写评分和评论" };
  }

  await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId, rating, title, content },
    update: { rating, title, content },
  });

  revalidatePath(`/en/products/${slug}`);
  revalidatePath(`/zh/products/${slug}`);
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
  return { success: true };
}

export async function removeWishlistItemAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId },
  });
  revalidatePath("/account/wishlist");
}
