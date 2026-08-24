import { prisma } from "@/lib/db";

export async function getProductRatingMap(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, { avg: number; count: number }>();

  const groups = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return new Map(
    groups.map((g) => [
      g.productId,
      { avg: g._avg.rating ?? 0, count: g._count.rating },
    ]),
  );
}

export async function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function displayReviewerName(name: string, email: string) {
  if (name.trim()) return name.trim();
  return maskEmail(email);
}
