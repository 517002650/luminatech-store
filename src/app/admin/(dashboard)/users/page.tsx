import { AdminShell } from "@/components/admin/AdminShell";
import { UserAdminTable } from "@/components/admin/UserAdminTable";
import { prisma } from "@/lib/db";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      bannedFromReviews: true,
      createdAt: true,
      _count: {
        select: { orders: true, reviews: true },
      },
    },
  });

  const bannedCount = users.filter((u) => u.bannedFromReviews).length;

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    bannedFromReviews: u.bannedFromReviews,
    createdAt: u.createdAt.toISOString(),
    orderCount: u._count.orders,
    reviewCount: u._count.reviews,
  }));

  return (
    <AdminShell
      title="用户管理"
      subtitle={
        bannedCount > 0
          ? `共 ${users.length} 人（本页）· ${bannedCount} 人禁止评价`
          : `共 ${users.length} 人（本页）· 可加入评价黑名单`
      }
    >
      <form className="mb-6 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="搜索邮箱或姓名"
          className="min-w-[240px] flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="submit"
          className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
        >
          搜索
        </button>
      </form>
      <UserAdminTable users={rows} />
    </AdminShell>
  );
}
