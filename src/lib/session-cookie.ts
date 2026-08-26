/**
 * Shared Secure flag for httpOnly session cookies (admin + storefront user).
 * Production defaults to Secure=true (HTTPS only).
 * Set ADMIN_COOKIE_SECURE=false only for temporary HTTP access via HK IP proxy.
 * See docs/HK-REVERSE-PROXY.md §12.
 */
export function sessionCookieSecure(): boolean {
  const raw = process.env.ADMIN_COOKIE_SECURE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  return process.env.NODE_ENV === "production";
}
