import { prisma } from "@/lib/db";

export type SiteSettingsData = {
  reviewModerationEnabled: boolean;
  affiliateSelfRegister: boolean;
  affiliateDefaultRate: number;
  affiliateAdminEmail: string;
  affiliateAdminPhone: string;
  affiliateAdminWechat: string;
  affiliateAdminNote: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  reviewModerationEnabled: true,
  affiliateSelfRegister: true,
  affiliateDefaultRate: 10,
  affiliateAdminEmail: "",
  affiliateAdminPhone: "",
  affiliateAdminWechat: "",
  affiliateAdminNote: "",
};

export async function ensureSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  if (existing) return existing;

  return prisma.siteSettings.create({
    data: {
      id: "default",
      ...DEFAULT_SITE_SETTINGS,
    },
  });
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const row = await ensureSiteSettings();
  return {
    reviewModerationEnabled: row.reviewModerationEnabled,
    affiliateSelfRegister: row.affiliateSelfRegister,
    affiliateDefaultRate: row.affiliateDefaultRate,
    affiliateAdminEmail: row.affiliateAdminEmail,
    affiliateAdminPhone: row.affiliateAdminPhone,
    affiliateAdminWechat: row.affiliateAdminWechat,
    affiliateAdminNote: row.affiliateAdminNote,
  };
}

export async function isReviewModerationEnabled() {
  const settings = await getSiteSettings();
  return settings.reviewModerationEnabled;
}

export async function updateSiteSettings(data: Partial<SiteSettingsData>) {
  await ensureSiteSettings();
  return prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      ...(typeof data.reviewModerationEnabled === "boolean"
        ? { reviewModerationEnabled: data.reviewModerationEnabled }
        : {}),
      ...(typeof data.affiliateSelfRegister === "boolean"
        ? { affiliateSelfRegister: data.affiliateSelfRegister }
        : {}),
      ...(typeof data.affiliateDefaultRate === "number" &&
      Number.isFinite(data.affiliateDefaultRate)
        ? { affiliateDefaultRate: data.affiliateDefaultRate }
        : {}),
      ...(typeof data.affiliateAdminEmail === "string"
        ? { affiliateAdminEmail: data.affiliateAdminEmail.trim() }
        : {}),
      ...(typeof data.affiliateAdminPhone === "string"
        ? { affiliateAdminPhone: data.affiliateAdminPhone.trim() }
        : {}),
      ...(typeof data.affiliateAdminWechat === "string"
        ? { affiliateAdminWechat: data.affiliateAdminWechat.trim() }
        : {}),
      ...(typeof data.affiliateAdminNote === "string"
        ? { affiliateAdminNote: data.affiliateAdminNote.trim() }
        : {}),
    },
  });
}

/** Prefer SiteSettings email, then CONTACT_EMAIL env. */
export async function getAffiliateAdminContact() {
  const s = await getSiteSettings();
  const email =
    s.affiliateAdminEmail.trim() ||
    process.env.CONTACT_EMAIL?.trim() ||
    "support@stagevio.com";
  return {
    email,
    phone: s.affiliateAdminPhone.trim(),
    wechat: s.affiliateAdminWechat.trim(),
    note: s.affiliateAdminNote.trim(),
  };
}
