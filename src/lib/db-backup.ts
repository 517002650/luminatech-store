import { prisma } from "@/lib/db";

export type DbBackupPayload = {
  version: 1;
  exportedAt: string;
  engine: "sqlite" | "postgresql" | "unknown";
  source: "admin" | "cli";
  counts: Record<string, number>;
  data: {
    users: unknown[];
    passwordResetTokens: unknown[];
    coupons: unknown[];
    shippingSettings: unknown[];
    categories: unknown[];
    products: unknown[];
    productVariants?: unknown[];
    productDownloads: unknown[];
    orders: unknown[];
    wishlistItems: unknown[];
    reviews: unknown[];
  };
};

function detectEngine(connection: string | undefined) {
  if (!connection) return "unknown" as const;
  if (connection.startsWith("file:")) return "sqlite" as const;
  if (connection.startsWith("postgres")) return "postgresql" as const;
  return "unknown" as const;
}

export function backupFileStamp(date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

/** Export all store tables into a portable JSON backup. */
export async function buildDbBackupPayload(
  source: "admin" | "cli" = "cli",
): Promise<DbBackupPayload> {
  const [
    users,
    passwordResetTokens,
    coupons,
    shippingSettings,
    categories,
    products,
    productVariants,
    productDownloads,
    orders,
    wishlistItems,
    reviews,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.passwordResetToken.findMany(),
    prisma.coupon.findMany(),
    prisma.shippingSettings.findMany(),
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.productVariant.findMany(),
    prisma.productDownload.findMany(),
    prisma.order.findMany(),
    prisma.wishlistItem.findMany(),
    prisma.review.findMany(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    engine: detectEngine(process.env.DATABASE_URL),
    source,
    counts: {
      users: users.length,
      passwordResetTokens: passwordResetTokens.length,
      coupons: coupons.length,
      shippingSettings: shippingSettings.length,
      categories: categories.length,
      products: products.length,
      productVariants: productVariants.length,
      productDownloads: productDownloads.length,
      orders: orders.length,
      wishlistItems: wishlistItems.length,
      reviews: reviews.length,
    },
    data: {
      users,
      passwordResetTokens,
      coupons,
      shippingSettings,
      categories,
      products,
      productVariants,
      productDownloads,
      orders,
      wishlistItems,
      reviews,
    },
  };
}
