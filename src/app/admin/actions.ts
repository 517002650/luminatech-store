"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requirePermission } from "@/lib/admin-auth";
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
    const { replaceProductVariants } = await import("@/lib/product-variants");
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: productInputToDbData(withCat),
      });
      await replaceProductVariants(product.id, withCat.variants, tx);
    });
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
    const { replaceProductVariants } = await import("@/lib/product-variants");
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: productInputToDbData(withCat),
      });
      await replaceProductVariants(id, withCat.variants, tx);
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

export async function updateOrderStatusAction(
  id: string,
  status: string,
  options?: { force?: boolean },
) {
  const admin = await requirePermission("orders");
  const { isOwnerSession } = await import("@/lib/admin-auth");
  const { canTransitionOrderStatus } = await import("@/lib/orders");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "订单不存在" };

  const force = Boolean(options?.force) && isOwnerSession(admin);
  if (options?.force && !isOwnerSession(admin)) {
    return { error: "仅 Owner 可强制跳转订单状态" };
  }

  const gate = canTransitionOrderStatus(order.status, status, { force });
  if (!gate.ok) return { error: gate.error };

  const data: { status: string; shippedAt?: Date } = { status };
  if (status === "shipped" && order.status !== "shipped" && !order.shippedAt) {
    data.shippedAt = new Date();
  }

  await prisma.order.update({
    where: { id },
    data,
  });

  if (status === "completed" && order.status !== "completed") {
    const { approveCommissionForCompletedOrder } = await import(
      "@/lib/affiliates"
    );
    await approveCommissionForCompletedOrder(id);
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
  return { success: true as const };
}

export async function refundOrderAction(id: string, formData: FormData) {
  const admin = await requirePermission("orders");
  const { hasPermission } = await import("@/lib/admin-auth");

  if (!hasPermission(admin, "refunds") && !hasPermission(admin, "refund_stripe")) {
    return { error: "无退款权限，请联系 Owner 在「团队账号」中开通「退款记账」或「Stripe 在线退款」" };
  }

  const reason = String(formData.get("reason") ?? "").trim();
  let skipStripe = formData.get("skipStripe") === "on";
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = amountRaw ? Number(amountRaw) : undefined;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "订单不存在" };

  const wantsStripe =
    order.paymentMethod === "stripe" && !skipStripe;

  if (wantsStripe && !hasPermission(admin, "refund_stripe")) {
    return {
      error:
        "你没有「Stripe 在线退款」权限。请勾选「仅记账（跳过 Stripe）」，或请有权限的同事操作。",
    };
  }

  if (!wantsStripe && !hasPermission(admin, "refunds")) {
    return { error: "无退款记账权限" };
  }

  // Non-Stripe payments always skip gateway
  if (order.paymentMethod !== "stripe") {
    skipStripe = true;
  }

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
  await requirePermission("orders");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "订单不存在" };

  const shippingCarrier = String(formData.get("shippingCarrier") ?? "other").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const notifyBuyer = formData.get("notifyBuyer") === "on";
  const channelMode = String(formData.get("fulfillmentChannel") ?? "").trim();

  if (notifyBuyer && !trackingNumber) {
    return { error: "通知买家前请先填写运单号" };
  }

  const data: {
    shippingCarrier: string;
    trackingNumber: string;
    fulfillmentChannel?: string;
  } = { shippingCarrier, trackingNumber };

  if (channelMode === "auto" || channelMode === "domestic" || channelMode === "export") {
    data.fulfillmentChannel = channelMode;
  }

  await prisma.order.update({
    where: { id },
    data,
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

/**
 * One-step fulfill: save logistics → mark shipped → email buyer.
 * Allowed from paid / processing (skips intermediate processing if still paid).
 */
export async function confirmShipOrderAction(id: string, formData: FormData) {
  await requirePermission("orders");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "订单不存在" };

  if (order.status === "cancelled") {
    return { error: "已取消订单不能发货" };
  }

  const shippingCarrier = String(formData.get("shippingCarrier") ?? "other").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const channelMode = String(formData.get("fulfillmentChannel") ?? "").trim();

  if (!trackingNumber) {
    return { error: "确认发货前请填写运单号" };
  }

  const data: {
    shippingCarrier: string;
    trackingNumber: string;
    status?: string;
    shippedAt?: Date;
    fulfillmentChannel?: string;
  } = { shippingCarrier, trackingNumber };

  if (channelMode === "auto" || channelMode === "domestic" || channelMode === "export") {
    data.fulfillmentChannel = channelMode;
  }

  const shouldMarkShipped = ["paid", "processing"].includes(order.status);
  if (shouldMarkShipped) {
    data.status = "shipped";
    if (!order.shippedAt) data.shippedAt = new Date();
  }

  await prisma.order.update({
    where: { id },
    data,
  });

  let notified = false;
  try {
    const updated = await prisma.order.findUnique({ where: { id } });
    if (updated) {
      await sendShippingEmail(updated);
      notified = true;
    }
  } catch (err) {
    console.error("Shipping email failed:", err);
    return {
      error: shouldMarkShipped
        ? "已标记发货并保存物流，但通知邮件发送失败"
        : "物流已更新，但通知邮件发送失败",
      shipped: shouldMarkShipped,
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/zh/account/orders");
  revalidatePath("/en/account/orders");
  revalidatePath(`/zh/account/orders/${id}`);
  revalidatePath(`/en/account/orders/${id}`);

  return {
    success: true as const,
    notified,
    shipped: shouldMarkShipped || order.status === "shipped",
  };
}

export async function generateCouponCodeAction() {
  await requireAdmin();
  const { allocateCouponCode } = await import("@/lib/coupons");
  const code = await allocateCouponCode();
  return { code };
}

export async function checkCouponCodeAction(code: string) {
  await requireAdmin();
  const { isCouponCodeAvailable, normalizeCouponCode } = await import(
    "@/lib/coupons"
  );
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return { available: false as const, error: "优惠码不能为空" };
  }
  const available = await isCouponCodeAvailable(normalized);
  return {
    available,
    error: available ? undefined : "该优惠码已存在",
  };
}

export async function createCouponAction(formData: FormData) {
  await requireAdmin();
  const {
    allocateCouponCode,
    isCouponCodeAvailable,
    normalizeCouponCode,
  } = await import("@/lib/coupons");

  const codeMode = String(formData.get("codeMode") ?? "auto");
  const type = String(formData.get("type") ?? "percent");
  const value = Number(formData.get("value") ?? 0);
  const minOrder = Number(formData.get("minOrder") ?? 0);
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  const affiliateIdRaw = String(formData.get("affiliateId") ?? "").trim();
  const affiliateId = affiliateIdRaw || null;

  if (!["percent", "fixed"].includes(type) || value <= 0) {
    return { error: "请填写有效的优惠码信息" };
  }
  if (type === "percent" && value > 100) {
    return { error: "百分比折扣不能超过 100%" };
  }
  if (affiliateId) {
    const aff = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
    if (!aff) return { error: "所选推广员不存在" };
  }

  let code: string;
  if (codeMode === "manual") {
    code = normalizeCouponCode(String(formData.get("code") ?? ""));
    if (!code) return { error: "请填写优惠码" };
    if (!(await isCouponCodeAvailable(code))) {
      return { error: "该优惠码已存在，请换一个或使用自动生成" };
    }
  } else {
    const preferred = normalizeCouponCode(String(formData.get("code") ?? ""));
    try {
      code = await allocateCouponCode({ preferred: preferred || null });
    } catch {
      return { error: "无法生成唯一优惠码，请重试" };
    }
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
        affiliateId,
      },
    });
  } catch {
    return { error: "创建失败，优惠码可能已存在" };
  }

  revalidatePath("/admin/coupons");
  revalidatePath("/admin/affiliates");
  redirect("/admin/coupons");
}

export async function toggleCouponAction(
  id: string,
  active: boolean,
  _formData?: FormData,
) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { active } });
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(id: string, _formData?: FormData) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
}

export async function updateShippingSettingsAction(formData: FormData) {
  await requirePermission("shipping");

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
  const admin = await requirePermission("returns");
  const { hasPermission } = await import("@/lib/admin-auth");

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
    const canOffline = hasPermission(admin, "refunds");
    const canStripe = hasPermission(admin, "refund_stripe");
    if (!canOffline && !canStripe) {
      return { error: "无退款权限，无法将退货标为已退款" };
    }

    const order = await prisma.order.findUnique({
      where: { id: existing.orderId },
    });
    if (!order) return { error: "关联订单不存在" };

    const isStripe = order.paymentMethod === "stripe";
    const skipStripe = !isStripe || !canStripe;

    if (isStripe && !canStripe && !canOffline) {
      return { error: "无 Stripe 退款权限" };
    }

    const {
      parseOrderItems,
      parseReturnItemsJson,
      returnLinesCoverWholeOrder,
      returnLinesMerchandiseTotal,
    } = await import("@/lib/orders");
    const { roundMoney } = await import("@/lib/pricing");

    const orderItems = parseOrderItems(order.items);
    const returnLines = parseReturnItemsJson(existing.itemsJson);
    const whole =
      returnLines.length === 0 ||
      returnLinesCoverWholeOrder(orderItems, returnLines);

    const result = whole
      ? await refundAndCancelOrder(existing.orderId, {
          reason: `RMA ${id}: ${existing.reason}`,
          skipStripe,
        })
      : await refundAndCancelOrder(existing.orderId, {
          reason: `RMA ${id} (行级): ${existing.reason}`,
          skipStripe,
          amount: roundMoney(
            Math.min(
              returnLinesMerchandiseTotal(returnLines),
              Math.max(0, order.total - (order.refundedAmount ?? 0)),
            ),
          ),
          restockLines: returnLines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
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
  await requirePermission("media");
  const { scanOrphanMedia } = await import("@/lib/orphan-media");
  return scanOrphanMedia({ includeOrders });
}

export async function deleteOrphanMediaAction(
  items: Array<{ publicId: string; resourceType: "image" | "raw" | "video" }>,
) {
  await requirePermission("media");
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

export async function searchUsersForAffiliateAction(
  query: string,
  allowUserId?: string,
) {
  await requireAdmin();
  const q = String(query ?? "").trim();
  if (q.length < 1) return [];

  const allowId = String(allowUserId ?? "").trim() || undefined;

  return prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
          ],
        },
        allowId
          ? { OR: [{ affiliate: null }, { id: allowId }] }
          : { affiliate: null },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, email: true, name: true },
  });
}

export async function createAffiliateAction(formData: FormData) {
  await requireAdmin();
  const { allocateAffiliateCode, normalizeAffiliateCode } = await import(
    "@/lib/affiliates"
  );

  const userId = String(formData.get("userId") ?? "").trim();
  const codeMode = String(formData.get("codeMode") ?? "auto");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const rate = Number(formData.get("commissionRate") ?? 10);

  if (!userId) return { error: "请搜索并选择要绑定的前台用户" };
  if (!name) return { error: "名称不能为空" };
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    return { error: "佣金比例须在 0–100 之间" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { affiliate: { select: { id: true } } },
  });
  if (!user) return { error: "所选用户不存在" };
  if (user.affiliate) return { error: "该用户已是推广员，请勿重复绑定" };

  let code: string;
  if (codeMode === "manual") {
    code = normalizeAffiliateCode(String(formData.get("code") ?? ""));
    if (!code) return { error: "推广码不能为空（仅字母数字_-）" };
    const taken = await prisma.affiliate.findUnique({ where: { code } });
    if (taken) return { error: "推广码已存在，请换一个" };
  } else {
    code = await allocateAffiliateCode({
      seed: email || name || user.email || user.name,
    });
  }

  try {
    await prisma.affiliate.create({
      data: {
        userId: user.id,
        code,
        name,
        email: email || user.email,
        notes,
        commissionRate: rate,
        active: true,
      },
    });
  } catch {
    return { error: "创建失败，推广码可能已存在" };
  }

  revalidatePath("/admin/affiliates");
  redirect("/admin/affiliates");
}

export async function updateAffiliateAction(id: string, formData: FormData) {
  await requireAdmin();
  const { allocateAffiliateCode, normalizeAffiliateCode } = await import(
    "@/lib/affiliates"
  );

  const userId = String(formData.get("userId") ?? "").trim();
  const codeMode = String(formData.get("codeMode") ?? "manual");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const rate = Number(formData.get("commissionRate") ?? 10);
  const active = formData.get("active") === "on";

  if (!userId) return { error: "请绑定前台用户" };
  if (!name) return { error: "名称不能为空" };
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    return { error: "佣金比例须在 0–100 之间" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { affiliate: { select: { id: true } } },
  });
  if (!user) return { error: "所选用户不存在" };
  if (user.affiliate && user.affiliate.id !== id) {
    return { error: "该用户已绑定其他推广员" };
  }

  const existing = await prisma.affiliate.findUnique({ where: { id } });
  if (!existing) return { error: "推广员不存在" };

  let code: string;
  if (codeMode === "auto") {
    code = await allocateAffiliateCode({
      seed: email || name || user.email || existing.code,
    });
  } else {
    code = normalizeAffiliateCode(String(formData.get("code") ?? ""));
    if (!code) return { error: "推广码不能为空" };
    const taken = await prisma.affiliate.findUnique({ where: { code } });
    if (taken && taken.id !== id) return { error: "推广码已被占用" };
  }

  try {
    await prisma.affiliate.update({
      where: { id },
      data: {
        userId: user.id,
        code,
        name,
        email: email || user.email,
        notes,
        commissionRate: rate,
        active,
      },
    });
  } catch {
    return { error: "更新失败，推广码可能已被占用" };
  }

  revalidatePath("/admin/affiliates");
  revalidatePath(`/admin/affiliates/${id}`);
  return { success: true as const };
}

export async function updateAffiliateProgramSettingsAction(formData: FormData) {
  await requireAdmin();
  const { updateSiteSettings } = await import("@/lib/site-settings");
  const rate = Number(formData.get("affiliateDefaultRate") ?? 10);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    return { error: "默认佣金比例须在 0–100 之间" };
  }
  await updateSiteSettings({
    affiliateSelfRegister: formData.get("affiliateSelfRegister") === "on",
    affiliateDefaultRate: rate,
    affiliateAdminEmail: String(formData.get("affiliateAdminEmail") ?? ""),
    affiliateAdminPhone: String(formData.get("affiliateAdminPhone") ?? ""),
    affiliateAdminWechat: String(formData.get("affiliateAdminWechat") ?? ""),
    affiliateAdminNote: String(formData.get("affiliateAdminNote") ?? ""),
  });
  revalidatePath("/admin/affiliates");
  revalidatePath("/account/affiliate");
  return { success: true as const };
}

export async function setAffiliateActiveAction(
  id: string,
  active: boolean,
  _formData?: FormData,
) {
  await requireAdmin();
  await prisma.affiliate.update({ where: { id }, data: { active } });
  revalidatePath("/admin/affiliates");
}

export async function setCommissionStatusAction(
  id: string,
  status: "pending" | "approved" | "paid" | "void",
  _formData?: FormData,
) {
  await requirePermission("commissions");
  const { COMMISSION_STATUSES } = await import("@/lib/affiliates");
  if (!(COMMISSION_STATUSES as readonly string[]).includes(status)) {
    return;
  }
  await prisma.commission.update({ where: { id }, data: { status } });
  revalidatePath("/admin/commissions");
  revalidatePath("/admin/finance");
}

/** Mark many approved commissions as paid (finance payout desk). */
export async function markApprovedCommissionsPaidAction(ids: string[]) {
  await requirePermission("finance");
  const unique = Array.from(new Set(ids.filter(Boolean))).slice(0, 500);
  if (unique.length === 0) return { error: "没有可结算记录" as const };

  await prisma.commission.updateMany({
    where: { id: { in: unique }, status: "approved" },
    data: { status: "paid" },
  });
  revalidatePath("/admin/commissions");
  revalidatePath("/admin/finance");
  return { success: true as const, count: unique.length };
}

