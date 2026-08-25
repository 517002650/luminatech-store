import { NextRequest, NextResponse } from "next/server";
import {
  buildContentDisposition,
  fetchAssetResponse,
} from "@/lib/asset-delivery";
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

  try {
    const target = download.fileUrl.startsWith("http")
      ? download.fileUrl
      : new URL(download.fileUrl, req.nextUrl.origin).toString();

    const asset = await fetchAssetResponse(target);
    const headers = new Headers();
    headers.set(
      "Content-Type",
      asset.headers.get("content-type") ?? "application/octet-stream",
    );
    headers.set(
      "Content-Disposition",
      buildContentDisposition(download.fileName || "download"),
    );
    headers.set("Cache-Control", "no-store");

    return new NextResponse(asset.body, { status: 200, headers });
  } catch (err) {
    console.error("Download delivery failed:", download.id, err);
    return NextResponse.json({ error: "download_failed" }, { status: 502 });
  }
}
