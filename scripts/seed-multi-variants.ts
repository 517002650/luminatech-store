import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { active: true },
    include: { variants: true },
    orderBy: { createdAt: "asc" },
  });
  if (!product) {
    console.log("No product found");
    return;
  }

  await prisma.productVariant.deleteMany({ where: { productId: product.id } });

  await prisma.productVariant.createMany({
    data: [
      {
        productId: product.id,
        sku: `${product.sku}-S`,
        nameEn: "Standard",
        nameZh: "标准版",
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: 20,
        active: true,
        isDefault: true,
        sortOrder: 0,
      },
      {
        productId: product.id,
        sku: `${product.sku}-PRO`,
        nameEn: "Pro Bundle",
        nameZh: "专业套装",
        price: Number((product.price * 1.35).toFixed(2)),
        compareAtPrice: Number((product.price * 1.6).toFixed(2)),
        stock: 8,
        active: true,
        isDefault: false,
        sortOrder: 1,
      },
      {
        productId: product.id,
        sku: `${product.sku}-LITE`,
        nameEn: "Lite",
        nameZh: "入门版",
        price: Number((product.price * 0.75).toFixed(2)),
        compareAtPrice: null,
        stock: 0,
        active: true,
        isDefault: false,
        sortOrder: 2,
      },
    ],
  });

  const variants = await prisma.productVariant.findMany({
    where: { productId: product.id },
    orderBy: { sortOrder: "asc" },
  });
  const def = variants.find((v) => v.isDefault) ?? variants[0];
  await prisma.product.update({
    where: { id: product.id },
    data: {
      sku: def.sku,
      price: def.price,
      compareAtPrice: def.compareAtPrice,
      stock: variants.filter((v) => v.active).reduce((s, v) => s + v.stock, 0),
    },
  });

  console.log(
    JSON.stringify(
      {
        slug: product.slug,
        nameZh: product.nameZh,
        variants: variants.map((v) => ({
          sku: v.sku,
          nameZh: v.nameZh,
          price: v.price,
          stock: v.stock,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
