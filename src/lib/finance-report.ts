import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/pricing";

export type FinanceRangeKey = "today" | "7d" | "month" | "custom";

export type FinanceDateRange = {
  from: Date;
  to: Date;
  range: FinanceRangeKey;
  fromStr: string;
  toStr: string;
};

const PAID_STATUSES = ["paid", "processing", "shipped", "completed"] as const;

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
}

/** Resolve finance date range from URL search params (UTC day bounds). */
export function resolveFinanceDateRange(params: {
  range?: string | null;
  from?: string | null;
  to?: string | null;
}): FinanceDateRange {
  const now = new Date();
  const raw = (params.range ?? "month").trim();
  const range: FinanceRangeKey =
    raw === "today" || raw === "7d" || raw === "month" || raw === "custom"
      ? raw
      : "month";

  let from: Date;
  let to: Date = endOfUtcDay(now);

  if (range === "today") {
    from = startOfUtcDay(now);
  } else if (range === "7d") {
    const d = new Date(now.getTime() - 6 * 86400000);
    from = startOfUtcDay(d);
  } else if (range === "custom") {
    const fromRaw = params.from?.trim();
    const toRaw = params.to?.trim();
    from = fromRaw
      ? new Date(`${fromRaw}T00:00:00.000Z`)
      : startOfUtcDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    to = toRaw ? new Date(`${toRaw}T23:59:59.999Z`) : endOfUtcDay(now);
    if (from > to) {
      const swap = from;
      from = startOfUtcDay(to);
      to = endOfUtcDay(swap);
    }
  } else {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  return {
    from,
    to,
    range,
    fromStr: toDateInputValue(from),
    toStr: toDateInputValue(to),
  };
}

export type OrderLedgerSummary = {
  orderCount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  refundedAmount: number;
  /** total − refundedAmount */
  netRevenue: number;
  cancelledCount: number;
};

export type FinanceOrderRow = {
  id: string;
  email: string;
  total: number;
  refundedAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: Date;
};

export type AffiliatePayoutRow = {
  affiliateId: string;
  code: string;
  name: string;
  pending: number;
  approved: number;
  paid: number;
  voided: number;
  count: number;
  approvedIds: string[];
};

export async function getOrderLedger(range: FinanceDateRange) {
  const whereCreated = {
    createdAt: { gte: range.from, lte: range.to },
  };

  const [paidOrders, allInRange] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...whereCreated,
        status: { in: [...PAID_STATUSES] },
      },
      select: {
        id: true,
        email: true,
        subtotal: true,
        discountAmount: true,
        shippingFee: true,
        taxAmount: true,
        total: true,
        refundedAmount: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.order.findMany({
      where: whereCreated,
      select: {
        refundedAmount: true,
        status: true,
        subtotal: true,
        discountAmount: true,
        shippingFee: true,
        taxAmount: true,
        total: true,
      },
    }),
  ]);

  const paidLike = allInRange.filter((o) =>
    (PAID_STATUSES as readonly string[]).includes(o.status),
  );
  const cancelledCount = allInRange.filter((o) => o.status === "cancelled").length;

  const sum = (pick: (o: (typeof allInRange)[number]) => number) =>
    roundMoney(paidLike.reduce((n, o) => n + pick(o), 0));

  const refundedAmount = roundMoney(
    allInRange.reduce((n, o) => n + (o.refundedAmount ?? 0), 0),
  );
  const total = sum((o) => o.total);

  const summary: OrderLedgerSummary = {
    orderCount: paidLike.length,
    subtotal: sum((o) => o.subtotal ?? 0),
    discountAmount: sum((o) => o.discountAmount ?? 0),
    shippingFee: sum((o) => o.shippingFee ?? 0),
    taxAmount: sum((o) => o.taxAmount ?? 0),
    total,
    refundedAmount,
    netRevenue: roundMoney(total - refundedAmount),
    cancelledCount,
  };

  const orders: FinanceOrderRow[] = paidOrders.map((o) => ({
    id: o.id,
    email: o.email,
    total: o.total,
    refundedAmount: o.refundedAmount ?? 0,
    status: o.status,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt,
  }));

  return { summary, orders };
}

export async function getAffiliatePayoutSummary(range: FinanceDateRange) {
  const rows = await prisma.commission.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
    },
    select: {
      id: true,
      amount: true,
      status: true,
      affiliateId: true,
      affiliate: { select: { code: true, name: true } },
    },
  });

  const map = new Map<string, AffiliatePayoutRow>();

  for (const row of rows) {
    let entry = map.get(row.affiliateId);
    if (!entry) {
      entry = {
        affiliateId: row.affiliateId,
        code: row.affiliate.code,
        name: row.affiliate.name,
        pending: 0,
        approved: 0,
        paid: 0,
        voided: 0,
        count: 0,
        approvedIds: [],
      };
      map.set(row.affiliateId, entry);
    }
    entry.count += 1;
    const amt = row.amount;
    if (row.status === "pending") entry.pending = roundMoney(entry.pending + amt);
    else if (row.status === "approved") {
      entry.approved = roundMoney(entry.approved + amt);
      entry.approvedIds.push(row.id);
    } else if (row.status === "paid") entry.paid = roundMoney(entry.paid + amt);
    else if (row.status === "void") entry.voided = roundMoney(entry.voided + amt);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "zh"),
  );
}

export async function listCommissionsInRange(range: FinanceDateRange) {
  return prisma.commission.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
    },
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: { select: { code: true, name: true } },
      order: { select: { id: true, email: true, total: true, status: true } },
    },
  });
}
