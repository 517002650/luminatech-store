"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { userHasPurchasedProduct } from "@/lib/product-downloads";
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

  if (user.bannedFromReviews) {
    return { error: "review_banned" as const };
  }

  const productId = String(formData.get("productId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const content = String(formData.get("content") ?? "").trim().slice(0, 4000);

  if (!productId || rating < 1 || rating > 5 || !title || !content) {
    return { error: "incomplete" as const };
  }

  const purchased = await userHasPurchasedProduct(user, productId);
  if (!purchased) {
    return { error: "purchase_required" as const };
  }

  const { isReviewModerationEnabled } = await import("@/lib/site-settings");
  const moderation = await isReviewModerationEnabled();
  const approved = !moderation;

  await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: {
      userId: user.id,
      productId,
      rating,
      title,
      content,
      verifiedPurchase: true,
      approved,
    },
    update: {
      rating,
      title,
      content,
      verifiedPurchase: true,
      approved,
    },
  });

  revalidatePath(`/en/products/${slug}`);
  revalidatePath(`/zh/products/${slug}`);
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
  revalidatePath("/admin/reviews");
  return {
    success: true as const,
    pending: moderation,
  };
}

export async function removeWishlistItemAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId },
  });
  revalidatePath("/account/wishlist");
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "en");

  if (!email) {
    return { error: "email_required" as const };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/${locale}/reset-password?token=${token}`;

    try {
      const result = await sendPasswordResetEmail(email, resetUrl);
      if (!result.sent) {
        if (result.reason === "smtp_not_configured") {
          console.error("Password reset blocked: SMTP is not configured");
          return { error: "smtp_unavailable" as const };
        }
        return { error: "smtp_failed" as const };
      }
    } catch (err) {
      console.error("Password reset email failed:", err);
      return { error: "smtp_failed" as const };
    }
  }

  return { success: true as const };
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  if (!token || password.length < 6) {
    return { error: "invalid" as const };
  }

  const tokenHash = hashResetToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return { error: "expired" as const };
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(password) },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });

  redirect(`/${locale}/login`);
}

export async function saveUserAddressAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "login_required" as const };

  const { upsertUserAddress } = await import("@/lib/user-addresses");
  const result = await upsertUserAddress(user.id, {
    id: String(formData.get("id") ?? "").trim() || undefined,
    label: String(formData.get("label") ?? "Default"),
    isDefault: formData.get("isDefault") === "on",
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    line2: String(formData.get("line2") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    country: String(formData.get("country") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
  });

  if ("error" in result && result.error) {
    return { error: result.error };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/en/account/addresses");
  revalidatePath("/zh/account/addresses");
  revalidatePath("/checkout");
  return { success: true as const };
}

export async function deleteUserAddressAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "login_required" as const };
  const { deleteUserAddress } = await import("@/lib/user-addresses");
  const result = await deleteUserAddress(user.id, id);
  if ("error" in result && result.error) return { error: result.error };
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true as const };
}

export async function setDefaultUserAddressAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "login_required" as const };
  const { setDefaultUserAddress } = await import("@/lib/user-addresses");
  const result = await setDefaultUserAddress(user.id, id);
  if ("error" in result && result.error) return { error: result.error };
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true as const };
}

/** Storefront user self-registers as promoter (bound to their account). */
export async function registerAsAffiliateAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "请先登录后再申请成为推广员" };

  const {
    getSiteSettings,
  } = await import("@/lib/site-settings");
  const {
    allocateAffiliateCode,
    normalizeAffiliateCode,
  } = await import("@/lib/affiliates");

  const settings = await getSiteSettings();
  if (!settings.affiliateSelfRegister) {
    return { error: "暂未开放自助注册，请联系管理员开通" };
  }

  const existing = await prisma.affiliate.findUnique({
    where: { userId: user.id },
  });
  if (existing) return { error: "您已经是推广员了" };

  const name =
    String(formData.get("name") ?? "").trim() ||
    user.name?.trim() ||
    user.email.split("@")[0];
  const codeMode = String(formData.get("codeMode") ?? "auto");

  let code: string;
  if (codeMode === "manual") {
    code = normalizeAffiliateCode(String(formData.get("code") ?? ""));
    if (!code) return { error: "请填写推广码（仅字母数字_-）" };
    const taken = await prisma.affiliate.findUnique({ where: { code } });
    if (taken) return { error: "该推广码已被占用，请换一个或改用自动生成" };
  } else {
    code = await allocateAffiliateCode({
      seed: name || user.email,
    });
  }

  const rate = settings.affiliateDefaultRate;
  try {
    await prisma.affiliate.create({
      data: {
        userId: user.id,
        code,
        name,
        email: user.email,
        commissionRate: rate,
        active: true,
        notes: "self-registered",
      },
    });
  } catch {
    return { error: "注册失败，请稍后重试或更换推广码" };
  }

  revalidatePath("/account/affiliate");
  revalidatePath("/zh/account/affiliate");
  revalidatePath("/en/account/affiliate");
  revalidatePath("/admin/affiliates");
  redirect("/account/affiliate");
}


