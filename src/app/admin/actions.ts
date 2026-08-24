"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  isAdminAuthenticated,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { sendShippingEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import {
  formDataToProductInput,
  productInputToDbData,
  validateProductInput,
} from "@/lib/product-admin";
import {
  buildCountryRatesFromForm,
  updateShippingSettings,
} from "@/lib/shipping-settings";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

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

  const input = formDataToProductInput(formData);
  const errors = validateProductInput(input);
  if (errors.length > 0) {
    return { error: errors.join("；") };
  }

  try {
    await prisma.product.create({ data: productInputToDbData(input) });
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

  const input = formDataToProductInput(formData);
  const errors = validateProductInput(input);
  if (errors.length > 0) {
    return { error: errors.join("；") };
  }

  try {
    await prisma.product.update({
      where: { id },
      data: productInputToDbData(input),
    });
  } catch {
    return { error: "更新失败，Slug 或 SKU 可能已被占用" };
  }

  revalidatePath("/admin");
  revalidatePath("/en");
  revalidatePath("/zh");
  revalidatePath("/en/products");
  revalidatePath("/zh/products");
  revalidatePath(`/en/products/${input.slug}`);
  revalidatePath(`/zh/products/${input.slug}`);
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

export async function updateOrderStatusAction(id: string, status: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "订单不存在" };

  await prisma.order.update({
    where: { id },
    data: { status },
  });

  if (status === "shipped" && order.status !== "shipped") {
    try {
      await sendShippingEmail(order);
    } catch (err) {
      console.error("Shipping email failed:", err);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
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
