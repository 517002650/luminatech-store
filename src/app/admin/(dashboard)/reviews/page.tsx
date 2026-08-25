import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewModerationTable } from "@/components/admin/ReviewModerationTable";
import { ReviewModerationToggle } from "@/components/admin/ReviewModerationToggle";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AdminReviewsPage() {
  const [settings, reviews] = await Promise.all([
    getSiteSettings(),
    prisma.review.findMany({
      orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { nameZh: true, nameEn: true, slug: true } },
      },
      take: 100,
    }),
  ]);

  const pendingCount = reviews.filter((r) => !r.approved).length;
  const moderation = settings.reviewModerationEnabled;

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
        moderation
          ? pendingCount > 0
            ? `${pendingCount} 条待审核 · 仅已购用户可提交，通过后才展示`
            : "审核已开启 · 仅已购用户可提交，通过后才展示"
          : "审核已关闭 · 已购用户提交后立即展示（仍可手动下架）"
      }
    >
      <div className="space-y-6">
        <ReviewModerationToggle enabled={moderation} />
        <ReviewModerationTable reviews={rows} />
      </div>
    </AdminShell>
  );
}
