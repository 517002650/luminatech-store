import { NextRequest, NextResponse } from "next/server";
import {
  buildContentDisposition,
  fetchAssetResponse,
} from "@/lib/asset-delivery";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/** Admin-only: proxy Cloudinary/local assets (direct URLs often return 401 for zip). */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fileUrl = req.nextUrl.searchParams.get("url") ?? "";
  const fileName = req.nextUrl.searchParams.get("name") ?? "download";
  if (!fileUrl) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  try {
    const asset = await fetchAssetResponse(fileUrl);
    const headers = new Headers();
    headers.set(
      "Content-Type",
      asset.headers.get("content-type") ?? "application/octet-stream",
    );
    headers.set("Content-Disposition", buildContentDisposition(fileName));
    headers.set("Cache-Control", "no-store");
    return new NextResponse(asset.body, { status: 200, headers });
  } catch (err) {
    console.error("Admin asset download failed:", fileUrl, err);
    return NextResponse.json({ error: "download_failed" }, { status: 502 });
  }
}
