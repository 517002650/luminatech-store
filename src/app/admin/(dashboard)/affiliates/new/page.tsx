import { AdminShell } from "@/components/admin/AdminShell";
import { AffiliateCreateForm } from "@/components/admin/AffiliateCreateForm";

export default function NewAffiliatePage() {
  return (
    <AdminShell title="新增推广员" subtitle="创建后把推广链接发给合作方即可">
      <AffiliateCreateForm />
    </AdminShell>
  );
}
