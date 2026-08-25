import { PrismaClient } from "@prisma/client";
import { backfillMissingVariants } from "../src/lib/product-variants";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.count();
  const variants = await prisma.productVariant.count();
  const missing = await prisma.product.count({
    where: { variants: { none: {} } },
  });
  console.log({ products, variants, missing });
  if (missing > 0) {
    await backfillMissingVariants();
    console.log("after backfill", {
      variants: await prisma.productVariant.count(),
      missing: await prisma.product.count({
        where: { variants: { none: {} } },
      }),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
