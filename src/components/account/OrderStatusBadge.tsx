import type { OrderStatus } from "@/lib/orders";

const STATUS_STYLES: Record<OrderStatus, string> = {
  paid: "bg-emerald-500/20 text-emerald-100 ring-emerald-400/45",
  processing: "bg-sky-500/20 text-sky-100 ring-sky-400/45",
  shipped: "bg-violet-500/20 text-violet-100 ring-violet-400/45",
  completed: "bg-zinc-500/20 text-zinc-100 ring-zinc-400/45",
  cancelled: "bg-red-500/20 text-red-100 ring-red-400/45",
};

export function OrderStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const style =
    STATUS_STYLES[status as OrderStatus] ??
    "bg-zinc-500/20 text-zinc-100 ring-zinc-400/45";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${style}`}
    >
      {label}
    </span>
  );
}
