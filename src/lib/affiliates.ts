import {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE,
  normalizeAffiliateCode,
} from "@/lib/affiliate-cookie";
import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/pricing";
import type { Prisma } from "@prisma/client";

export {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE,
  normalizeAffiliateCode,
};

export const COMMISSION_STATUSES = [
  "pending",
  "approved",
  "paid",
  "void",
] as const;

export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: "待结算",
  approved: "可结算",
  paid: "已打款",
  void: "已作废",
};

type TxClient = Prisma.TransactionClient;

/** Build a short code seed from email / name. */
export function suggestAffiliateCodeSeed(seed: string) {
  const raw = String(seed ?? "")
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 10);
  return raw || "PROMO";
}

/**
 * Allocate a unique referral code.
 * - preferred: use if free after normalize
 * - otherwise generate from seed / random and suffix until unique
 */
export async function allocateAffiliateCode(options?: {
  preferred?: string | null;
  seed?: string | null;
}) {
  const preferred = normalizeAffiliateCode(options?.preferred);
  if (preferred) {
    const taken = await prisma.affiliate.findUnique({ where: { code: preferred } });
    if (!taken) return preferred;
  }

  const base =
    normalizeAffiliateCode(suggestAffiliateCodeSeed(options?.seed ?? "")) ||
    `LT${Date.now().toString(36).toUpperCase().slice(-6)}`;

  for (let i = 0; i < 30; i++) {
    const candidate =
      i === 0
        ? base
        : normalizeAffiliateCode(`${base}${i + 1}`) || `${base}${i + 1}`;
    const taken = await prisma.affiliate.findUnique({ where: { code: candidate } });
    if (!taken) return candidate;
  }

  return normalizeAffiliateCode(`LT${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase());
}

export async function findActiveAffiliateByCode(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return null;
  return prisma.affiliate.findFirst({
    where: { code: normalized, active: true },
  });
}

export type AffiliateAttribution = {
  affiliateId: string;
  affiliateCode: string;
  commissionRate: number;
  /** How attribution was resolved */
  source?: "coupon" | "link";
};

/** Resolve attribution from cookie / explicit ref code. First non-empty wins. */
export async function resolveAffiliateAttribution(
  ...candidates: (string | null | undefined)[]
): Promise<AffiliateAttribution | null> {
  for (const raw of candidates) {
    const code = normalizeAffiliateCode(raw);
    if (!code) continue;
    const affiliate = await findActiveAffiliateByCode(code);
    if (affiliate) {
      return {
        affiliateId: affiliate.id,
        affiliateCode: affiliate.code,
        commissionRate: affiliate.commissionRate,
        source: "link",
      };
    }
  }
  return null;
}

/**
 * Checkout attribution priority:
 * 1) Coupon bound to an active affiliate (when coupon applied)
 * 2) Link cookie / explicit ref code
 */
export async function resolveCheckoutAttribution(options: {
  couponAffiliateId?: string | null;
  couponAffiliateCode?: string | null;
  couponCommissionRate?: number | null;
  linkCandidates?: (string | null | undefined)[];
}): Promise<AffiliateAttribution | null> {
  if (options.couponAffiliateId && options.couponAffiliateCode) {
    const affiliate = await prisma.affiliate.findFirst({
      where: { id: options.couponAffiliateId, active: true },
    });
    if (affiliate) {
      return {
        affiliateId: affiliate.id,
        affiliateCode: affiliate.code,
        commissionRate:
          options.couponCommissionRate ?? affiliate.commissionRate,
        source: "coupon",
      };
    }
  }

  return resolveAffiliateAttribution(...(options.linkCandidates ?? []));
}

export function commissionBaseFromOrder(order: {
  subtotal: number;
  discountAmount: number;
}) {
  return Math.max(0, roundMoney(order.subtotal - (order.discountAmount ?? 0)));
}

export function calcCommissionAmount(baseAmount: number, rate: number) {
  return roundMoney((baseAmount * rate) / 100);
}

/**
 * Create pending commission after order is paid (idempotent per orderId).
 */
export async function createCommissionForOrder(
  order: {
    id: string;
    subtotal: number;
    discountAmount: number;
    affiliateId: string | null;
    affiliateCode: string;
  },
  db: TxClient | typeof prisma = prisma,
) {
  if (!order.affiliateId) return null;

  const existing = await db.commission.findUnique({
    where: { orderId: order.id },
  });
  if (existing) return existing;

  const affiliate = await db.affiliate.findUnique({
    where: { id: order.affiliateId },
  });
  if (!affiliate || !affiliate.active) return null;

  const baseAmount = commissionBaseFromOrder(order);
  if (baseAmount <= 0) return null;

  const rate = affiliate.commissionRate;
  const amount = calcCommissionAmount(baseAmount, rate);
  if (amount <= 0) return null;

  try {
    return await db.commission.create({
      data: {
        orderId: order.id,
        affiliateId: affiliate.id,
        baseAmount,
        rate,
        amount,
        status: "pending",
      },
    });
  } catch {
    return db.commission.findUnique({ where: { orderId: order.id } });
  }
}

/** Full refund / cancel → void commission. Partial → reduce amount. */
export async function adjustCommissionOnRefund(
  orderId: string,
  options: { full: boolean; orderTotal: number; refundedTotal: number },
  db: TxClient | typeof prisma = prisma,
) {
  const commission = await db.commission.findUnique({ where: { orderId } });
  if (!commission) return;
  if (commission.status === "void" || commission.status === "paid") {
    if (options.full && commission.status !== "void") {
      await db.commission.update({
        where: { id: commission.id },
        data: {
          status: "void",
          note: [commission.note, "订单全额退款作废"]
            .filter(Boolean)
            .join("；")
            .slice(0, 500),
        },
      });
    }
    return;
  }

  if (options.full) {
    await db.commission.update({
      where: { id: commission.id },
      data: {
        status: "void",
        note: [commission.note, "订单全额退款作废"]
          .filter(Boolean)
          .join("；")
          .slice(0, 500),
      },
    });
    return;
  }

  const total = options.orderTotal > 0 ? options.orderTotal : 1;
  const remainingRatio = Math.max(
    0,
    1 - options.refundedTotal / total,
  );
  const newAmount = roundMoney(commission.baseAmount * (commission.rate / 100) * remainingRatio);
  await db.commission.update({
    where: { id: commission.id },
    data: {
      amount: newAmount,
      note: [commission.note, `部分退款后调整为 $${newAmount.toFixed(2)}`]
        .filter(Boolean)
        .join("；")
        .slice(0, 500),
      ...(newAmount <= 0 ? { status: "void" } : {}),
    },
  });
}

export async function approveCommissionForCompletedOrder(orderId: string) {
  const commission = await prisma.commission.findUnique({
    where: { orderId },
  });
  if (!commission || commission.status !== "pending") return;
  await prisma.commission.update({
    where: { id: commission.id },
    data: { status: "approved" },
  });
}

export function buildAffiliateLink(code: string, appUrl?: string) {
  const base =
    (appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
  return `${base}/zh?ref=${encodeURIComponent(normalizeAffiliateCode(code))}`;
}
