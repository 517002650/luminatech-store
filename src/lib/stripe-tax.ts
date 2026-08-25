import { COUNTRY_OPTIONS } from "@/lib/countries";
import type { ShippingAddress } from "@/lib/orders";

/** Enable Stripe Tax on Checkout when set (Dashboard Tax must be activated). */
export function isStripeTaxEnabled() {
  const raw = process.env.STRIPE_TAX_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function toStripeCountryCode(country: string): string | undefined {
  const code = country.trim().toUpperCase();
  if (!code || code === "OTHER") return undefined;
  if (COUNTRY_OPTIONS.some((c) => c.code === code && c.code !== "OTHER")) {
    return code;
  }
  return undefined;
}

export function shippingAddressForStripeCustomer(address: ShippingAddress) {
  const country = toStripeCountryCode(address.country);
  if (!country) return undefined;

  return {
    name: address.name,
    phone: address.phone || undefined,
    address: {
      line1: address.line1,
      line2: address.line2 || undefined,
      city: address.city,
      state: address.state || undefined,
      postal_code: address.postalCode,
      country,
    },
  };
}
