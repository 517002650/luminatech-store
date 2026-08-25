import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewModerationTable } from "@/components/admin/ReviewModerationTable";
import { prisma } from "@/lib/db";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { nameZh: true, nameEn: true, slug: true } },
    },
    take: 100,
  });

  const pendingCount = reviews.filter((r) => !r.approved).length;

  const rows = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    approved: r.approved,
    verifiedPurchase: r.verifiedPurchase,
    createdAt: r.createdAt,
    productName: r.product.nameZh || r.product.nameEn,
    productSlug: r.product.slug,
    author: r.user.name?.trim() || r.user.email,
  }));

  return (
    <AdminShell
      title="评价审核"
      subtitle={
        pendingCount > 0
          ? `${pendingCount} 条待审核 · 仅已购用户可提交，通过后才会展示在商品页`
          : "仅已购用户可提交评价，通过后才会展示在商品页"
      }
    >
      <ReviewModerationTable reviews={rows} />
    </AdminShell>
  );
}
