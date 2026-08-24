import type { OrderStatus } from "@/lib/orders";

const STATUS_STYLES: Record<OrderStatus, string> = {
  paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  processing: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  shipped: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  completed: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  cancelled: "bg-red-500/15 text-red-300 ring-red-500/30",
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
    "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${style}`}
    >
      {label}
    </span>
  );
}
