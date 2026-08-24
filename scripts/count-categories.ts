import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.product.groupBy({
    by: ["categoryKey"],
    _count: { _all: true },
  });
  console.log(JSON.stringify(groups, null, 2));
  console.log("total", await prisma.product.count());
}

main()
  .finally(() => prisma.$disconnect());
