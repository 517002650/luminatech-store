import { AdminShell } from "@/components/admin/AdminShell";
import { ContactInboxTable } from "@/components/admin/ContactInboxTable";
import { prisma } from "@/lib/db";

export default async function AdminInboxPage() {
  const inquiries = await prisma.contactInquiry.findMany({
    orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const openCount = inquiries.filter((i) => !i.handled).length;

  return (
    <AdminShell
      title="客户留言"
      subtitle={
        openCount > 0
          ? `${openCount} 条未处理 · 来自前台联系表单`
          : "来自前台联系表单的留言会显示在这里"
      }
    >
      <ContactInboxTable inquiries={inquiries} />
    </AdminShell>
  );
}
