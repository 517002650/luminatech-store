"use client";

import { formatPrice } from "@/lib/format";
import {
  formatOrderId,
  parseOrderItems,
  parseShippingAddress,
} from "@/lib/orders";

type Props = {
  order: {
    id: string;
    email: string;
    subtotal?: number;
    shippingFee?: number;
    taxAmount?: number;
    discountAmount?: number;
    couponCode?: string;
    total: number;
    refundedAmount?: number;
    paymentMethod: string;
    paymentId: string | null;
    items: string;
    shippingAddress: string;
    createdAt: Date;
    shippingCarrier?: string;
    trackingNumber?: string;
  };
};

/** Screen + print-friendly invoice / packing slip. */
export function OrderInvoicePanel({ order }: Props) {
  const items = parseOrderItems(order.items);
  const shipping = parseShippingAddress(order.shippingAddress);
  const orderNo = formatOrderId(order.id);

  function printDoc() {
    document
      .querySelectorAll(".print-target")
      .forEach((el) => el.classList.remove("print-target"));
    document
      .getElementById(`packing-slip-${order.id}`)
      ?.classList.add("print-target");
    window.print();
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 print:rounded-none print:border-0 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="text-lg font-semibold text-stone-900">发货单 / 装箱单</h2>
        <button
          type="button"
          onClick={printDoc}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          打印发货单
        </button>
      </div>
      <p className="mt-1 text-xs text-stone-500 print:hidden">
        Packing Slip · 仓库拣货装箱用；国内/跨境通用。非正式税票。
      </p>

      <div
        id={`packing-slip-${order.id}`}
        className="mt-4 space-y-6 text-stone-900"
      >
        <header className="border-b border-stone-200 pb-4">
          <p className="text-2xl font-bold tracking-tight">Stagevio</p>
          <p className="mt-1 text-sm text-stone-600">Packing Slip / 发货单</p>
          <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <p>
              <span className="text-stone-500">Order #</span> {orderNo}
            </p>
            <p>
              <span className="text-stone-500">Date</span>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p>
              <span className="text-stone-500">Email</span> {order.email || "—"}
            </p>
            <p>
              <span className="text-stone-500">Payment</span>{" "}
              {order.paymentMethod.toUpperCase()}
              {order.paymentId ? ` · ${order.paymentId}` : ""}
            </p>
          </div>
        </header>

        {shipping ? (
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Ship to
            </h3>
            <p className="mt-1 font-medium">{shipping.name}</p>
            <p className="text-sm">
              {shipping.line1}
              {shipping.line2 ? `, ${shipping.line2}` : ""}
            </p>
            <p className="text-sm">
              {shipping.city}
              {shipping.state ? `, ${shipping.state}` : ""} {shipping.postalCode}
            </p>
            <p className="text-sm">{shipping.country}</p>
            {shipping.phone ? <p className="text-sm">Tel: {shipping.phone}</p> : null}
          </section>
        ) : null}

        {(order.shippingCarrier || order.trackingNumber) && (
          <section className="text-sm">
            <p>
              Carrier: {order.shippingCarrier || "—"} · Tracking:{" "}
              {order.trackingNumber || "—"}
            </p>
          </section>
        )}

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 text-left">
              <th className="py-2 pr-2 font-semibold">Item</th>
              <th className="py-2 pr-2 font-semibold">Qty</th>
              <th className="py-2 pr-2 text-right font-semibold">Unit</th>
              <th className="py-2 text-right font-semibold">Line</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const option =
                item.variantNameEn ||
                item.variantNameZh ||
                item.variantSku ||
                "";
              return (
              <tr
                key={`${item.productId}-${item.variantId ?? "base"}-${item.slug}`}
                className="border-b border-stone-100"
              >
                <td className="py-2 pr-2">
                  <span className="font-medium">
                    {item.nameEn || item.nameZh}
                    {option ? ` (${option})` : ""}
                  </span>
                  {item.nameZh && item.nameEn ? (
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {item.nameZh}
                      {item.variantNameZh ? ` (${item.variantNameZh})` : ""}
                    </span>
                  ) : null}
                </td>
                <td className="py-2 pr-2">{item.quantity}</td>
                <td className="py-2 pr-2 text-right">{formatPrice(item.price)}</td>
                <td className="py-2 text-right">
                  {formatPrice(item.price * item.quantity)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
          <Row label="Subtotal" value={formatPrice(order.subtotal ?? order.total)} />
          {(order.discountAmount ?? 0) > 0 ? (
            <Row
              label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
              value={`-${formatPrice(order.discountAmount!)}`}
            />
          ) : null}
          <Row
            label="Shipping"
            value={
              (order.shippingFee ?? 0) === 0
                ? "Free"
                : formatPrice(order.shippingFee!)
            }
          />
          {(order.taxAmount ?? 0) > 0 ? (
            <Row label="Tax" value={formatPrice(order.taxAmount!)} />
          ) : null}
          <Row label="Total" value={formatPrice(order.total)} bold />
          {(order.refundedAmount ?? 0) > 0 ? (
            <Row
              label="Refunded"
              value={`-${formatPrice(order.refundedAmount!)}`}
            />
          ) : null}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden !important; }
              .print-target, .print-target * { visibility: visible !important; }
              .print-target {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 24px;
              }
            }
          `,
        }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${bold ? "border-t border-stone-200 pt-2 text-base font-bold" : ""}`}
    >
      <span className="text-stone-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
