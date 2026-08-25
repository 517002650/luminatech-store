/**
 * Export all Prisma tables to backups/*.json
 *
 * Usage:
 *   npm run db:backup
 *   set BACKUP_DATABASE_URL=postgresql://... && npm run db:backup
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

const url = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL or BACKUP_DATABASE_URL");
  process.exit(1);
}

process.env.DATABASE_URL = url;

const prisma = new PrismaClient();

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function detectEngine(connection: string) {
  if (connection.startsWith("file:")) return "sqlite";
  if (connection.startsWith("postgres")) return "postgresql";
  return "unknown";
}

async function main() {
  const connectionUrl = url as string;
  const engine = detectEngine(connectionUrl);
  console.log(`Backing up (${engine})…`);

  const [
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
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.passwordResetToken.findMany(),
    prisma.coupon.findMany(),
    prisma.shippingSettings.findMany(),
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.productDownload.findMany(),
    prisma.order.findMany(),
    prisma.wishlistItem.findMany(),
    prisma.review.findMany(),
  ]);

  const payload = {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    engine,
    source: "cli" as const,
    counts: {
      users: users.length,
      passwordResetTokens: passwordResetTokens.length,
      coupons: coupons.length,
      shippingSettings: shippingSettings.length,
      categories: categories.length,
      products: products.length,
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
      productDownloads,
      orders,
      wishlistItems,
      reviews,
    },
  };

  const dir = path.join(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `db-${stamp()}.json`);
  const json = JSON.stringify(payload, null, 2);
  await writeFile(file, json, "utf8");
  await writeFile(path.join(dir, "latest.json"), json, "utf8");

  console.log(`Saved ${file}`);
  console.log(`Also updated backups/latest.json`);
  console.log("Counts:", payload.counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
