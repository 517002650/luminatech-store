import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/** Admin-only: wipe buyer accounts/orders (keeps products & downloads). */
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "清空账号") {
    return NextResponse.json(
      { error: "请在请求体中提交 confirm: \"清空账号\"" },
      { status: 400 },
    );
  }

  const before = {
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    reviews: await prisma.review.count(),
    wishlist: await prisma.wishlistItem.count(),
    downloads: await prisma.productDownload.count(),
  };

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

  return NextResponse.json({
    ok: true,
    message: "已清空买家账号与订单，商品和下载附件保留",
    before,
    after,
  });
}
