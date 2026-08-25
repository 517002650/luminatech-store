import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Comma-separated hostnames (no protocol). Used when admin/storefront is accessed via HK reverse proxy. */
function parseServerActionsAllowedOrigins(): string[] {
  const raw = process.env.SERVER_ACTIONS_ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

const serverActionOrigins = parseServerActionsAllowedOrigins();

const nextConfig: NextConfig = {
  ...(serverActionOrigins.length > 0
    ? { serverActions: { allowedOrigins: serverActionOrigins } }
    : {}),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
