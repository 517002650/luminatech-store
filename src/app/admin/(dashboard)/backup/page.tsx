import { AdminShell } from "@/components/admin/AdminShell";
import { BackupDownloadPanel } from "@/components/admin/BackupDownloadPanel";
import { requirePermission } from "@/lib/admin-auth";

export default async function AdminBackupPage() {
  const admin = await requirePermission("backup");
  return (
    <AdminShell
      title="数据备份"
      subtitle="一键下载备份到电脑，并配合 Neon 云端快照，防止数据丢失"
      admin={admin}
    >
      <BackupDownloadPanel />
    </AdminShell>
  );
}
