"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  getAdminPasswordConfigError,
  isAdminAuthenticated,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { sendShippingEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { refundAndCancelOrder } from "@/lib/order-refund";
import {
  applyCategoryLabels,
  formDataToProductInput,
  productInputToDbData,
  validateProductInput,
} from "@/lib/product-admin";
import {
  slugifyCategoryKey,
} from "@/lib/categories";
import {
  buildCountryRatesFromForm,
  updateShippingSettings,
} from "@/lib/shipping-settings";
import { deleteStoredAsset } from "@/lib/asset-delivery";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  const configError = getAdminPasswordConfigError();
  if (configError) {
    return { error: configError };
  }

  if (!verifyAdminPassword(password)) {
    return { error: "密码错误" };
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const raw = formDataToProductInput(formData);
  const withCat = await applyCategoryLabels(raw);
  if ("error" in withCat) return withCat;

  const errors = validateProductInput(withCat);
  if (errors.length > 0) {
    return { error: errors.join("；") };
  }

  try {
    await prisma.product.create({ data: productInputToDbData(withCat) });
  } catch {
    return { error: "创建失败，Slug 或 SKU 可能已存在" };
  }

  revalidatePath("/admin");
  revalidatePath("/en");
  revalidatePath("/zh");
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
  redirect("/admin");
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin();

  const raw = formDataToProductInput(formData);
  const withCat = await applyCategoryLabels(raw);
  if ("error" in withCat) return withCat;

  const errors = validateProductInput(withCat);
  if (errors.length > 0) {
    return { error: errors.join("；") };
  }

  try {
    await prisma.product.update({
      where: { id },
      data: productInputToDbData(withCat),
    });
  } catch {
    return { error: "更新失败，Slug 或 SKU 可能已被占用" };
  }

  revalidatePath("/admin");
  revalidatePath("/en");
  revalidatePath("/zh");
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
  revalidatePath(`/en/products/${withCat.slug}`);
  revalidatePath(`/zh/products/${withCat.slug}`);
  redirect("/admin");
}

export async function deleteProductAction(id: string) {
  await requireAdmin();

  await prisma.product.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/en");
  revalidatePath("/zh");
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
}

export async function setProductActiveAction(id: string, active: boolean) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!product) return { error: "商品不存在" };

  await prisma.product.update({
    where: { id },
    data: { active },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/en");
  revalidatePath("/zh");
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
  revalidatePath(`/en/products/${product.slug}`);
  revalidatePath(`/zh/products/${product.slug}`);
  return { success: true as const };
}

export async function createProductDownloadAction(productId: string, formData: FormData) {
  await requireAdmin();

  const type = String(formData.get("type") ?? "").trim();
  const version = String(formData.get("version") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const titleZh = String(formData.get("titleZh") ?? "").trim();
  const notesEn = String(formData.get("notesEn") ?? "").trim();
  const notesZh = String(formData.get("notesZh") ?? "").trim();
  const fileUrl = String(formData.get("fileUrl") ?? "").trim();
  const fileName = String(formData.get("fileName") ?? "").trim();
  const fileSize = Number(formData.get("fileSize") ?? 0);
  const isLatest = formData.get("isLatest") === "on";

  if (!["firmware", "file", "plugin"].includes(type)) {
    return { error: "请选择类型：固件 / 文件 / 插件" };
  }
  if (!version || !titleEn || !titleZh || !fileUrl || !fileName) {
    return { error: "请填写版本、标题并上传文件" };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "商品不存在" };

  if (isLatest) {
    await prisma.productDownload.updateMany({
      where: { productId, type },
      data: { isLatest: false },
    });
  }

  await prisma.productDownload.create({
    data: {
      productId,
      type,
      version,
      titleEn,
      titleZh,
      notesEn,
      notesZh,
      fileUrl,
      fileName,
      fileSize: Number.isFinite(fileSize) ? fileSize : 0,
      isLatest,
    },
  });

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/en/products/${product.slug}`);
  revalidatePath(`/zh/products/${product.slug}`);
  return { success: true as const };
}

export async function deleteProductDownloadAction(
  id: string,
  options?: { deleteCloudinary?: boolean },
) {
  await requireAdmin();

  const row = await prisma.productDownload.findUnique({
    where: { id },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!row) return { error: "记录不存在" };

  let cloudDeleted: boolean | undefined;
  let cloudReason: string | undefined;
  if (options?.deleteCloudinary) {
    const result = await deleteStoredAsset(row.fileUrl);
    cloudDeleted = result.deleted;
    cloudReason = result.reason;
  }

  await prisma.productDownload.delete({ where: { id } });

  revalidatePath(`/admin/products/${row.product.id}/edit`);
  revalidatePath(`/en/products/${row.product.slug}`);
  revalidatePath(`/zh/products/${row.product.slug}`);
  return {
    success: true as const,
    cloudDeleted,
    cloudReason,
  };
}

export async function replaceProductDownloadFileAction(
  id: string,
  input: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    deleteOldCloudinary?: boolean;
  },
) {
  await requireAdmin();

  const fileUrl = input.fileUrl.trim();
  const fileName = input.fileName.trim();
  const fileSize = Number(input.fileSize);

  if (!fileUrl || !fileName) {
    return { error: "请先上传新文件" };
  }

  const row = await prisma.productDownload.findUnique({
    where: { id },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!row) return { error: "记录不存在" };

  const oldUrl = row.fileUrl;

  await prisma.productDownload.update({
    where: { id },
    data: {
      fileUrl,
      fileName,
      fileSize: Number.isFinite(fileSize) ? fileSize : 0,
    },
  });

  let cloudDeleted: boolean | undefined;
  let cloudReason: string | undefined;
  if (input.deleteOldCloudinary && oldUrl && oldUrl !== fileUrl) {
    const result = await deleteStoredAsset(oldUrl);
    cloudDeleted = result.deleted;
    cloudReason = result.reason;
  }

  revalidatePath(`/admin/products/${row.product.id}/edit`);
  revalidatePath(`/en/products/${row.product.slug}`);
  revalidatePath(`/zh/products/${row.product.slug}`);
  return {
    success: true as const,
    cloudDeleted,
    cloudReason,
  };
}

export async function setLatestProductDownloadAction(id: string) {
  await requireAdmin();

  const row = await prisma.productDownload.findUnique({
    where: { id },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!row) return { error: "记录不存在" };

  await prisma.productDownload.updateMany({
    where: { productId: row.productId, type: row.type },
    data: { isLatest: false },
  });
  await prisma.productDownload.update({
    where: { id },
    data: { isLatest: true },
  });

  revalidatePath(`/admin/products/${row.product.id}/edit`);
  revalidatePath(`/en/products/${row.product.slug}`);
  revalidatePath(`/zh/products/${row.product.slug}`);
  return { success: true as const };
}

export async function updateOrderStatusAction(id: string, status: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "订单不存在" };

  await prisma.order.update({
    where: { id },
    data: { status },
  });

  if (status === "cancelled" && order.status !== "cancelled") {
    const { restockItems } = await import("@/lib/cart-validation");
    const { parseOrderItems } = await import("@/lib/orders");
    await restockItems(parseOrderItems(order.items));
  }

  if (status === "shipped" && order.status !== "shipped") {
    try {
      const updated = await prisma.order.findUnique({ where: { id } });
      if (updated) await sendShippingEmail(updated);
    } catch (err) {
      console.error("Shipping email failed:", err);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/zh/account/orders");
  revalidatePath("/en/account/orders");
  revalidatePath(`/zh/account/orders/${id}`);
  revalidatePath(`/en/account/orders/${id}`);
}

export async function refundOrderAction(id: string, formData: FormData) {
  await requireAdmin();

  const reason = String(formData.get("reason") ?? "").trim();
  const skipStripe = formData.get("skipStripe") === "on";
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = amountRaw ? Number(amountRaw) : undefined;

  const result = await refundAndCancelOrder(id, {
    skipStripe,
    reason,
    amount: Number.isFinite(amount) ? amount : undefined,
  });
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/zh/account/orders");
  revalidatePath("/en/account/orders");
  revalidatePath(`/zh/account/orders/${id}`);
  revalidatePath(`/en/account/orders/${id}`);

  return {
    success: true as const,
    stripeRefundId: result.stripeRefundId,
    partial: Boolean(result.partial),
  };
}

export async function updateOrderTrackingAction(id: string, formData: FormData) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "订单不存在" };

  const shippingCarrier = String(formData.get("shippingCarrier") ?? "other").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const notifyBuyer = formData.get("notifyBuyer") === "on";

  if (notifyBuyer && !trackingNumber) {
    return { error: "通知买家前请先填写运单号" };
  }

  await prisma.order.update({
    where: { id },
    data: { shippingCarrier, trackingNumber },
  });

  let notified = false;
  if (notifyBuyer) {
    try {
      const updated = await prisma.order.findUnique({ where: { id } });
      if (updated) {
        await sendShippingEmail(updated);
        notified = true;
      }
    } catch (err) {
      console.error("Shipping email failed:", err);
      return { error: "物流已保存，但发货通知邮件发送失败" };
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/zh/account/orders");
  revalidatePath("/en/account/orders");
  revalidatePath(`/zh/account/orders/${id}`);
  revalidatePath(`/en/account/orders/${id}`);

  return { success: true as const, notified };
}

export async function createCouponAction(formData: FormData) {
  await requireAdmin();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "percent");
  const value = Number(formData.get("value") ?? 0);
  const minOrder = Number(formData.get("minOrder") ?? 0);
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;

  if (!code || !["percent", "fixed"].includes(type) || value <= 0) {
    return { error: "请填写有效的优惠码信息" };
  }
  if (type === "percent" && value > 100) {
    return { error: "百分比折扣不能超过 100%" };
  }

  try {
    await prisma.coupon.create({
      data: {
        code,
        type,
        value,
        minOrder,
        maxUses: Number.isFinite(maxUses) ? maxUses : null,
        expiresAt,
        active: true,
      },
    });
  } catch {
    return { error: "创建失败，优惠码可能已存在" };
  }

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function toggleCouponAction(id: string, active: boolean) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { active } });
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(id: string) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
}

export async function updateShippingSettingsAction(formData: FormData) {
  await requireAdmin();

  const freeShippingThreshold = Number(formData.get("freeShippingThreshold") ?? 0);
  const flatRate = Number(formData.get("flatRate") ?? 0);
  const euRate = Number(formData.get("euRate") ?? 0);

  if (
    !Number.isFinite(freeShippingThreshold) ||
    freeShippingThreshold < 0 ||
    !Number.isFinite(flatRate) ||
    flatRate < 0 ||
    !Number.isFinite(euRate) ||
    euRate < 0
  ) {
    return { error: "请填写有效的运费数值" };
  }

  const countryRates = buildCountryRatesFromForm(formData);

  await updateShippingSettings({
    freeShippingThreshold,
    flatRate,
    euRate,
    countryRates,
  });

  revalidatePath("/admin/shipping");
  revalidatePath("/zh/checkout");
  revalidatePath("/en/checkout");

  return { success: true as const };
}

function revalidateCategoryPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/en");
  revalidatePath("/zh");
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();

  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameZh = String(formData.get("nameZh") ?? "").trim();
  const keyInput = String(formData.get("key") ?? "").trim();
  const key = slugifyCategoryKey(keyInput || nameEn);
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const active = formData.get("active") === "on";

  if (!nameEn || !nameZh || !key) {
    return { error: "请填写中英文名称与标识" };
  }

  try {
    await prisma.category.create({
      data: {
        key,
        nameEn,
        nameZh,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        active,
      },
    });
  } catch {
    return { error: "创建失败，分类标识可能已存在" };
  }

  revalidateCategoryPaths();
  redirect("/admin/categories");
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await requireAdmin();

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return { error: "分类不存在" };

  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameZh = String(formData.get("nameZh") ?? "").trim();
  const keyInput = String(formData.get("key") ?? "").trim();
  const key = slugifyCategoryKey(keyInput || nameEn);
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const active = formData.get("active") === "on";

  if (!nameEn || !nameZh || !key) {
    return { error: "请填写中英文名称与标识" };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: {
        key,
        nameEn,
        nameZh,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        active,
      },
    });
  } catch {
    return { error: "更新失败，分类标识可能已被占用" };
  }

  // Keep product labels / keys in sync when category changes.
  await prisma.product.updateMany({
    where: { categoryKey: existing.key },
    data: {
      categoryKey: key,
      categoryEn: nameEn,
      categoryZh: nameZh,
    },
  });

  revalidateCategoryPaths();
  redirect("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return { error: "分类不存在" };

  const productCount = await prisma.product.count({
    where: { categoryKey: existing.key },
  });
  if (productCount > 0) {
    return { error: `该分类下还有 ${productCount} 个商品，请先改商品分类后再删除` };
  }

  await prisma.category.delete({ where: { id } });
  revalidateCategoryPaths();
  return { success: true as const };
}

export async function setReviewApprovedAction(id: string, approved: boolean) {
  await requireAdmin();

  const review = await prisma.review.findUnique({
    where: { id },
    include: { product: { select: { slug: true } } },
  });
  if (!review) return { error: "评价不存在" };

  await prisma.review.update({
    where: { id },
    data: { approved },
  });

  revalidatePath("/admin/reviews");
  revalidatePath(`/en/products/${review.product.slug}`);
  revalidatePath(`/zh/products/${review.product.slug}`);
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
  return { success: true as const };
}

export async function setContactHandledAction(id: string, handled: boolean) {
  await requireAdmin();
  await prisma.contactInquiry.update({
    where: { id },
    data: { handled },
  });
  revalidatePath("/admin/inbox");
  return { success: true as const };
}

export async function setReturnRequestStatusAction(id: string, status: string) {
  await requireAdmin();

  const allowed = new Set([
    "requested",
    "approved",
    "rejected",
    "received",
    "refunded",
  ]);
  if (!allowed.has(status)) return { error: "invalid_status" as const };

  const existing = await prisma.returnRequest.findUnique({ where: { id } });
  if (!existing) return { error: "退货申请不存在" };

  if (status === "refunded" && existing.status !== "refunded") {
    const result = await refundAndCancelOrder(existing.orderId, {
      reason: `RMA ${id}: ${existing.reason}`,
    });
    if (!result.ok) {
      return { error: result.error };
    }
  }

  const row = await prisma.returnRequest.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/orders/${row.orderId}`);
  revalidatePath(`/en/account/orders/${row.orderId}`);
  revalidatePath(`/zh/account/orders/${row.orderId}`);
  return { success: true as const };
}

export async function scanOrphanMediaAction(includeOrders = true) {
  await requireAdmin();
  const { scanOrphanMedia } = await import("@/lib/orphan-media");
  return scanOrphanMedia({ includeOrders });
}

export async function deleteOrphanMediaAction(
  items: Array<{ publicId: string; resourceType: "image" | "raw" | "video" }>,
) {
  await requireAdmin();
  const { deleteOrphanMediaItems } = await import("@/lib/orphan-media");
  return deleteOrphanMediaItems(items);
}

export async function setReviewModerationEnabledAction(enabled: boolean) {
  await requireAdmin();
  const { updateSiteSettings } = await import("@/lib/site-settings");
  await updateSiteSettings({ reviewModerationEnabled: enabled });
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/users");
  return { success: true as const };
}

export async function setUserBannedFromReviewsAction(
  userId: string,
  banned: boolean,
) {
  await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return { error: "用户不存在" };

  await prisma.user.update({
    where: { id: userId },
    data: { bannedFromReviews: banned },
  });

  revalidatePath("/admin/users");
  return { success: true as const };
}

