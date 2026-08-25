import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const prod = await prisma.product.findFirst({
    where: { slug: "grandma3-full-size" },
    include: { variants: true },
  });
  console.log(
    JSON.stringify(
      {
        id: prod?.id,
        variants: prod?.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
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
