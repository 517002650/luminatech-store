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
