import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { calcSubtotal, roundMoney, type CartLine } from "@/lib/pricing";

/** Uppercase trim for coupon codes (stored and matched in uppercase). */
export function normalizeCouponCode(code: string | null | undefined): string {
  return String(code ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

const COUPON_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCouponSuffix(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += COUPON_CODE_CHARS[bytes[i]! % COUPON_CODE_CHARS.length];
  }
  return out;
}

/** Build a random coupon code candidate (not guaranteed unique). */
export function generateRandomCouponCode(prefix = "CP"): string {
  return `${prefix}${randomCouponSuffix(8)}`;
}

export async function isCouponCodeAvailable(code: string): Promise<boolean> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return false;
  const existing = await prisma.coupon.findUnique({
    where: { code: normalized },
    select: { id: true },
  });
  return !existing;
}

/**
 * Allocate a unique coupon code.
 * - preferred: use if free after normalize
 * - otherwise generate random codes until unique
 */
export async function allocateCouponCode(options?: {
  preferred?: string | null;
}): Promise<string> {
  const preferred = normalizeCouponCode(options?.preferred);
  if (preferred && (await isCouponCodeAvailable(preferred))) {
    return preferred;
  }

  for (let i = 0; i < 30; i++) {
    const candidate = generateRandomCouponCode();
    if (await isCouponCodeAvailable(candidate)) return candidate;
  }

  const fallback = normalizeCouponCode(
    `CP${Date.now().toString(36).toUpperCase()}${randomCouponSuffix(4)}`,
  );
  if (await isCouponCodeAvailable(fallback)) return fallback;

  throw new Error("Unable to allocate unique coupon code");
}

export type CouponValidation = {
  valid: boolean;
  discountAmount: number;
  couponCode: string | null;
  error?: string;
  /** When coupon is bound to an active affiliate */
  affiliateId?: string | null;
  affiliateCode?: string | null;
  commissionRate?: number | null;
};

export async function validateCouponCode(
  code: string | null | undefined,
  items: CartLine[],
): Promise<CouponValidation> {
  const subtotal = calcSubtotal(items);
  if (!code?.trim()) {
    return { valid: true, discountAmount: 0, couponCode: null };
  }

  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
    include: { affiliate: true },
  });

  if (!coupon || !coupon.active) {
    return { valid: false, discountAmount: 0, couponCode: null, error: "invalid" };
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, discountAmount: 0, couponCode: null, error: "expired" };
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discountAmount: 0, couponCode: null, error: "max_uses" };
  }

  if (subtotal < coupon.minOrder) {
    return { valid: false, discountAmount: 0, couponCode: null, error: "min_order" };
  }

  let discountAmount = 0;
  if (coupon.type === "percent") {
    discountAmount = roundMoney(subtotal * (coupon.value / 100));
  } else if (coupon.type === "fixed") {
    discountAmount = roundMoney(Math.min(coupon.value, subtotal));
  } else {
    return { valid: false, discountAmount: 0, couponCode: null, error: "invalid" };
  }

  const bound =
    coupon.affiliate && coupon.affiliate.active
      ? {
          affiliateId: coupon.affiliate.id,
          affiliateCode: coupon.affiliate.code,
          commissionRate: coupon.affiliate.commissionRate,
        }
      : {
          affiliateId: null,
          affiliateCode: null,
          commissionRate: null,
        };

  return {
    valid: true,
    discountAmount,
    couponCode: coupon.code,
    ...bound,
  };
}

export async function incrementCouponUsage(code: string | null | undefined) {
  if (!code?.trim()) return;
  const normalized = code.trim().toUpperCase();
  await prisma.coupon.updateMany({
    where: { code: normalized, active: true },
    data: { usedCount: { increment: 1 } },
  });
}
