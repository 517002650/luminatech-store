/** Edge-safe affiliate cookie helpers (no Prisma / Node-only deps). */

export const AFFILIATE_COOKIE = "lt_affiliate_ref";
/** 30 days */
export const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function normalizeAffiliateCode(raw: string | null | undefined) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}
