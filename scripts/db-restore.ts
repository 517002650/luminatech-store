/**
 * Restore a JSON backup created by scripts/db-backup.ts
 *
 * Usage:
 *   # Restore into current DATABASE_URL (DANGEROUS on production)
 *   npm run db:restore -- backups/db-20260825-120000.json
 *
 *   # Restore latest backup into local SQLite
 *   set RESTORE_DATABASE_URL=file:./prisma/dev.db
 *   npm run db:restore -- backups/latest.json
 *
 * Requires Prisma client generated for the target engine
 * (schema.prisma for Postgres, schema.local.prisma for SQLite).
 */
import { readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

type BackupFile = {
  version: number;
  data: {
    users: Record<string, unknown>[];
    passwordResetTokens: Record<string, unknown>[];
    coupons: Record<string, unknown>[];
    shippingSettings: Record<string, unknown>[];
    categories: Record<string, unknown>[];
    products: Record<string, unknown>[];
    productDownloads: Record<string, unknown>[];
    orders: Record<string, unknown>[];
    wishlistItems: Record<string, unknown>[];
    reviews: Record<string, unknown>[];
  };
};

const url = process.env.RESTORE_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL or RESTORE_DATABASE_URL");
  process.exit(1);
}

const backupArg = process.argv[2] || "backups/latest.json";
const confirm = process.argv.includes("--yes") || process.env.RESTORE_YES === "1";

if (!confirm) {
  console.error(
    [
      "This will WIPE matching tables on the target database and reload from backup.",
      `Target: ${url.replace(/:[^:@/]+@/, ":****@")}`,
      `Backup: ${backupArg}`,
      "",
      "Re-run with --yes to confirm, e.g.",
      "  npm run db:restore -- backups/latest.json --yes",
    ].join("\n"),
  );
  process.exit(1);
}

process.env.DATABASE_URL = url;
const prisma = new PrismaClient();

function reviveDates<T extends Record<string, unknown>>(row: T, fields: string[]): T {
  const next = { ...row };
  for (const field of fields) {
    const value = next[field];
    if (typeof value === "string") {
      next[field] = new Date(value);
    }
  }
  return next;
}

async function main() {
  const filePath = path.isAbsolute(backupArg)
    ? backupArg
    : path.join(process.cwd(), backupArg);
  const raw = await readFile(filePath, "utf8");
  const backup = JSON.parse(raw) as BackupFile;

  if (!backup?.data) {
    throw new Error("Invalid backup file (missing data)");
  }

  const {
    users,
    passwordResetTokens,
    coupons,
    shippingSettings,
    categories,
    products,
    productDownloads,
    orders,
    wishlistItems,
    reviews,
  } = backup.data;

  console.log(`Restoring from ${filePath} → ${url.replace(/:[^:@/]+@/, ":****@")}`);

  // Children first
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productDownload.deleteMany();
  await prisma.order.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shippingSettings.deleteMany();

  // Parents first
  if (users.length) {
    await prisma.user.createMany({
      data: users.map((u) =>
        reviveDates(u, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  if (categories.length) {
    await prisma.category.createMany({
      data: categories.map((c) =>
        reviveDates(c, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  if (coupons.length) {
    await prisma.coupon.createMany({
      data: coupons.map((c) =>
        reviveDates(c, ["createdAt", "updatedAt", "expiresAt"]) as never,
      ),
    });
  }
  if (shippingSettings.length) {
    await prisma.shippingSettings.createMany({
      data: shippingSettings.map((s) =>
        reviveDates(s, ["updatedAt"]) as never,
      ),
    });
  }
  if (products.length) {
    await prisma.product.createMany({
      data: products.map((p) =>
        reviveDates(p, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  if (passwordResetTokens.length) {
    await prisma.passwordResetToken.createMany({
      data: passwordResetTokens.map((t) =>
        reviveDates(t, ["expiresAt", "createdAt"]) as never,
      ),
    });
  }
  if (productDownloads.length) {
    await prisma.productDownload.createMany({
      data: productDownloads.map((d) =>
        reviveDates(d, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  if (orders.length) {
    await prisma.order.createMany({
      data: orders.map((o) =>
        reviveDates(o, ["createdAt", "updatedAt"]) as never,
      ),
    });
  }
  if (wishlistItems.length) {
    await prisma.wishlistItem.createMany({
      data: wishlistItems.map((w) =>
        reviveDates(w, ["createdAt"]) as never,
      ),
    });
  }
  if (reviews.length) {
    await prisma.review.createMany({
      data: reviews.map((r) =>
        reviveDates(r, ["createdAt"]) as never,
      ),
    });
  }

  console.log("Restore complete:", {
    users: users.length,
    categories: categories.length,
    products: products.length,
    orders: orders.length,
    productDownloads: productDownloads.length,
    reviews: reviews.length,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
