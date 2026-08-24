import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { userHasPurchasedProduct } from "@/lib/product-downloads";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Secure download: only purchasers (logged-in + paid order) get the file.
 * Non-buyers receive 404 so existence is not revealed.
 */
export async function GET(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const download = await prisma.productDownload.findUnique({ where: { id } });
  if (!download) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const purchased = await userHasPurchasedProduct(user, download.productId);
  if (!purchased) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const target = download.fileUrl.startsWith("http")
    ? download.fileUrl
    : new URL(download.fileUrl, req.nextUrl.origin).toString();

  return NextResponse.redirect(target, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
