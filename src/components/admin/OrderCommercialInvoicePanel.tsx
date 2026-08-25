"use client";

import { formatPrice } from "@/lib/format";
import {
  formatOrderId,
  parseOrderItems,
  parseShippingAddress,
} from "@/lib/orders";
import { getFulfillmentCarrierLabel } from "@/lib/fulfillment";

type Props = {
  order: {
    id: string;
    email: string;
    subtotal?: number;
    shippingFee?: number;
    taxAmount?: number;
    discountAmount?: number;
    total: number;
    paymentMethod: string;
    items: string;
    shippingAddress: string;
    createdAt: Date;
    shippingCarrier?: string;
    trackingNumber?: string;
  };
};

/** Export commercial invoice (customs), not a tax invoice. */
export function OrderCommercialInvoicePanel({ order }: Props) {
  const items = parseOrderItems(order.items);
  const shipping = parseShippingAddress(order.shippingAddress);
  const orderNo = formatOrderId(order.id);

  const merch = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const missingHs = items.filter((i) => !i.hsCode?.trim()).length;

  function printDoc() {
    document
      .querySelectorAll(".print-target")
      .forEach((el) => el.classList.remove("print-target"));
    document
      .getElementById(`commercial-invoice-${order.id}`)
      ?.classList.add("print-target");
    window.print();
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 print:rounded-none print:border-0 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">商业发票（跨境）</h2>
          <p className="mt-1 text-xs text-stone-500">
            Commercial Invoice · 供海关/承运商申报，非正式税务发票。
          </p>
        </div>
        <button
          type="button"
          onClick={printDoc}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          打印商业发票
        </button>
      </div>

      {missingHs > 0 ? (
        <p className="mt-3 text-xs text-amber-700 print:hidden">
          有 {missingHs} 行商品缺少 HS 编码，请在商品编辑页补充「海关信息」后对新订单生效（本单可手写补全）。
        </p>
      ) : null}

      <div
        id={`commercial-invoice-${order.id}`}
        className="mt-4 space-y-5 text-stone-900"
      >
        <header className="border-b border-stone-200 pb-4">
          <p className="text-2xl font-bold tracking-tight">LuminaTech</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide">
            Commercial Invoice
          </p>
          <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <p>
              <span className="text-stone-500">Invoice #</span> CI-{orderNo}
            </p>
            <p>
              <span className="text-stone-500">Date</span>{" "}
              {new Date(order.createdAt).toISOString().slice(0, 10)}
            </p>
            <p>
              <span className="text-stone-500">Order #</span> {orderNo}
            </p>
            <p>
              <span className="text-stone-500">Incoterms</span> DDU (unless
              otherwise agreed)
            </p>
          </div>
        </header>

        <div className="grid gap-6 text-sm sm:grid-cols-2">
          <section>
            <h3 className="font-semibold uppercase tracking-wide text-stone-500">
              Shipper
            </h3>
            <p className="mt-1 font-medium">LuminaTech</p>
            <p>Export from China (seller warehouse)</p>
            <p>{order.email || "—"}</p>
          </section>
          <section>
            <h3 className="font-semibold uppercase tracking-wide text-stone-500">
              Consignee
            </h3>
            {shipping ? (
              <>
                <p className="mt-1 font-medium">{shipping.name}</p>
                <p>
                  {shipping.line1}
                  {shipping.line2 ? `, ${shipping.line2}` : ""}
                </p>
                <p>
                  {shipping.city}
                  {shipping.state ? `, ${shipping.state}` : ""}{" "}
                  {shipping.postalCode}
                </p>
                <p>{shipping.country}</p>
                {shipping.phone ? <p>Tel: {shipping.phone}</p> : null}
              </>
            ) : (
              <p className="mt-1">—</p>
            )}
          </section>
        </div>

        {(order.shippingCarrier || order.trackingNumber) && (
          <p className="text-sm">
            Carrier:{" "}
            {getFulfillmentCarrierLabel(order.shippingCarrier || "other", "en")}{" "}
            · AWB: {order.trackingNumber || "—"}
          </p>
        )}

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 text-left">
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2">HS</th>
              <th className="py-2 pr-2">Origin</th>
              <th className="py-2 pr-2">Qty</th>
              <th className="py-2 pr-2 text-right">Unit (USD)</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.productId}-${item.variantId ?? "base"}`}
                className="border-b border-stone-100"
              >
                <td className="py-2 pr-2">
                  {item.customsDescEn || item.nameEn || item.nameZh}
                  {item.variantSku ? (
                    <span className="block text-xs text-stone-500">
                      SKU: {item.variantSku}
                    </span>
                  ) : null}
                </td>
                <td className="py-2 pr-2 font-mono text-xs">
                  {item.hsCode || "—"}
                </td>
                <td className="py-2 pr-2">{item.originCountry || "CN"}</td>
                <td className="py-2 pr-2">{item.quantity}</td>
                <td className="py-2 pr-2 text-right">
                  {formatPrice(item.price)}
                </td>
                <td className="py-2 text-right">
                  {formatPrice(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-stone-600">Merchandise</span>
            <span>{formatPrice(merch)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-stone-600">Shipping</span>
            <span>{formatPrice(order.shippingFee ?? 0)}</span>
          </div>
          {(order.taxAmount ?? 0) > 0 ? (
            <div className="flex justify-between gap-4">
              <span className="text-stone-600">Tax</span>
              <span>{formatPrice(order.taxAmount!)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-stone-200 pt-2 font-bold">
            <span>Total (USD)</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <p className="text-xs text-stone-500">
          I hereby certify that the information on this invoice is true and
          correct, and that the contents of this shipment are as stated above.
        </p>
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
