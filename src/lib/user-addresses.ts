import { prisma } from "@/lib/db";
import type { ShippingAddress } from "@/lib/orders";
import { validateShippingAddress } from "@/lib/orders";

export type SavedAddress = {
  id: string;
  label: string;
  isDefault: boolean;
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

export function savedToShipping(addr: SavedAddress): ShippingAddress {
  return {
    name: addr.name,
    phone: addr.phone,
    email: addr.email,
    line1: addr.line1,
    line2: addr.line2 || undefined,
    city: addr.city,
    state: addr.state,
    country: addr.country,
    postalCode: addr.postalCode,
  };
}

export async function listUserAddresses(userId: string): Promise<SavedAddress[]> {
  const rows = await prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    isDefault: r.isDefault,
    name: r.name,
    phone: r.phone,
    email: r.email,
    line1: r.line1,
    line2: r.line2,
    city: r.city,
    state: r.state,
    country: r.country,
    postalCode: r.postalCode,
  }));
}

export async function upsertUserAddress(
  userId: string,
  input: ShippingAddress & { label?: string; isDefault?: boolean; id?: string },
) {
  const error = validateShippingAddress(input);
  if (error) return { error };

  const label = (input.label ?? "Default").trim().slice(0, 40) || "Default";
  const isDefault = Boolean(input.isDefault);

  if (isDefault) {
    await prisma.userAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const data = {
    label,
    isDefault,
    name: input.name.trim(),
    phone: (input.phone ?? "").trim(),
    email: (input.email ?? "").trim(),
    line1: input.line1.trim(),
    line2: (input.line2 ?? "").trim(),
    city: input.city.trim(),
    state: (input.state ?? "").trim(),
    country: input.country.trim(),
    postalCode: input.postalCode.trim(),
  };

  if (input.id) {
    const existing = await prisma.userAddress.findFirst({
      where: { id: input.id, userId },
    });
    if (!existing) return { error: "地址不存在" };
    await prisma.userAddress.update({ where: { id: input.id }, data });
    return { success: true as const, id: input.id };
  }

  const count = await prisma.userAddress.count({ where: { userId } });
  const row = await prisma.userAddress.create({
    data: {
      userId,
      ...data,
      isDefault: count === 0 ? true : isDefault,
    },
  });
  return { success: true as const, id: row.id };
}

export async function deleteUserAddress(userId: string, id: string) {
  const existing = await prisma.userAddress.findFirst({ where: { id, userId } });
  if (!existing) return { error: "地址不存在" };
  await prisma.userAddress.delete({ where: { id } });
  if (existing.isDefault) {
    const next = await prisma.userAddress.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    if (next) {
      await prisma.userAddress.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }
  return { success: true as const };
}

export async function setDefaultUserAddress(userId: string, id: string) {
  const existing = await prisma.userAddress.findFirst({ where: { id, userId } });
  if (!existing) return { error: "地址不存在" };
  await prisma.userAddress.updateMany({
    where: { userId },
    data: { isDefault: false },
  });
  await prisma.userAddress.update({
    where: { id },
    data: { isDefault: true },
  });
  return { success: true as const };
}
