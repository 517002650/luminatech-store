/**
 * Clear buyer account data (users, orders, reviews, wishlist).
 * Keeps products, categories, downloads, coupons, shipping settings.
 *
 * Usage (production):
 *   npx vercel env run --environment production -- npx tsx scripts/clear-user-accounts.ts
 */
import { PrismaClient } from "@prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl.startsWith("postgres")) {
  console.error(
    "DATABASE_URL must be a PostgreSQL connection string. Use:\n" +
      "  npx vercel env run --environment production -- npx tsx scripts/clear-user-accounts.ts",
  );
  process.exit(1);
}

try {
  const host = new URL(dbUrl.replace(/^postgres(ql)?:\/\//, "http://")).hostname;
  console.log("Connecting to database host:", host);
} catch {
  console.log("DATABASE_URL set (host parse skipped)");
}

const prisma = new PrismaClient();

async function main() {
  const before = {
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    reviews: await prisma.review.count(),
    wishlist: await prisma.wishlistItem.count(),
    downloads: await prisma.productDownload.count(),
  };

  console.log("Before:", before);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany(),
    prisma.review.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const after = {
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    reviews: await prisma.review.count(),
    wishlist: await prisma.wishlistItem.count(),
    downloads: await prisma.productDownload.count(),
  };

  console.log("After:", after);
  console.log("Done. Products and download attachments were kept.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
