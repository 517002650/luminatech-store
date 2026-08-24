import { prisma } from "@/lib/db";
import { parseOrderItems } from "@/lib/orders";

const VALID_ORDER_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "completed",
]);

export const DOWNLOAD_TYPES = ["firmware", "file", "plugin"] as const;
export type DownloadType = (typeof DOWNLOAD_TYPES)[number];

export const DOWNLOAD_TYPE_LABELS: Record<
  DownloadType,
  { en: string; zh: string }
> = {
  firmware: { en: "Firmware", zh: "固件" },
  file: { en: "File", zh: "文件" },
  plugin: { en: "Plugin", zh: "插件" },
};

/** Paid (non-cancelled) product IDs owned by this user. */
export async function getPurchasedProductIds(
  user: { id: string; email: string } | null,
): Promise<string[]> {
  if (!user) return [];

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId: user.id }, { email: user.email }],
      status: { not: "cancelled" },
    },
    select: { items: true, status: true },
  });

  const ids = new Set<string>();
  for (const order of orders) {
    if (!VALID_ORDER_STATUSES.has(order.status)) continue;
    for (const item of parseOrderItems(order.items)) {
      ids.add(item.productId);
    }
  }
  return [...ids];
}

/** True if user owns a paid (non-cancelled) order containing this product. */
export async function userHasPurchasedProduct(
  user: { id: string; email: string } | null,
  productId: string,
) {
  const ids = await getPurchasedProductIds(user);
  return ids.includes(productId);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isDownloadType(value: string): value is DownloadType {
  return (DOWNLOAD_TYPES as readonly string[]).includes(value);
}
