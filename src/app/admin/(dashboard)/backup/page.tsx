import { AdminShell } from "@/components/admin/AdminShell";
import { BackupDownloadPanel } from "@/components/admin/BackupDownloadPanel";

export default function AdminBackupPage() {
  return (
    <AdminShell
      title="数据备份"
      subtitle="一键下载备份到电脑，并配合 Neon 云端快照，防止数据丢失"
    >
      <BackupDownloadPanel />
    </AdminShell>
  );
}
