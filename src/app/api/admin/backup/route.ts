import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { backupFileStamp, buildDbBackupPayload } from "@/lib/db-backup";

/** Admin-only: download a full JSON database backup. */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = await buildDbBackupPayload("admin");
    const filename = `luminatech-备份-${backupFileStamp()}.json`;
    const body = JSON.stringify(payload, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Admin backup failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "backup_failed" },
      { status: 500 },
    );
  }
}
