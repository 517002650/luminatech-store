import { prisma } from "@/lib/db";

export type SiteSettingsData = {
  reviewModerationEnabled: boolean;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  reviewModerationEnabled: true,
};

export async function ensureSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  if (existing) return existing;

  return prisma.siteSettings.create({
    data: {
      id: "default",
      reviewModerationEnabled: DEFAULT_SITE_SETTINGS.reviewModerationEnabled,
    },
  });
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const row = await ensureSiteSettings();
  return {
    reviewModerationEnabled: row.reviewModerationEnabled,
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
    },
  });
}
