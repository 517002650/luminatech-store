import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AffiliateEditForm } from "@/components/admin/AffiliateEditForm";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function EditAffiliatePage({ params }: Props) {
  const { id } = await params;
  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!affiliate) notFound();

  return (
    <AdminShell title={`编辑推广员：${affiliate.name}`}>
      <AffiliateEditForm
        affiliate={{
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          commissionRate: affiliate.commissionRate,
          active: affiliate.active,
          notes: affiliate.notes,
          user: affiliate.user,
        }}
      />
    </AdminShell>
  );
}
