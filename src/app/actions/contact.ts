"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { sendContactInquiryEmail } from "@/lib/email";

export async function submitContactAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 160);
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000);
  const locale = String(formData.get("locale") ?? "en").slice(0, 8);

  if (!name || !email || !subject || !message) {
    return { error: "incomplete" as const };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "email_invalid" as const };
  }

  await prisma.contactInquiry.create({
    data: { name, email, subject, message, locale },
  });

  try {
    const result = await sendContactInquiryEmail({
      name,
      email,
      subject,
      message,
      locale,
    });
    if (!result.sent && result.reason === "smtp_not_configured") {
      // Inquiry is stored for admin; still tell user we received it.
      return { success: true as const, emailed: false as const };
    }
  } catch (err) {
    console.error("Contact email failed:", err);
    return { success: true as const, emailed: false as const };
  }

  revalidatePath("/admin/inbox");
  return { success: true as const, emailed: true as const };
}
