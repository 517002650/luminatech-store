"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  confirmShipOrderAction,
  updateOrderTrackingAction,
} from "@/app/admin/actions";
import {
  fulfillmentChannelLabel,
  getCarriersForChannel,
  resolveFulfillmentChannel,
  type FulfillmentChannel,
  type FulfillmentChannelMode,
} from "@/lib/fulfillment";

type Props = {
  orderId: string;
  shippingCarrier: string;
  trackingNumber: string;
  status: string;
  shippingAddress: string;
  fulfillmentChannel?: string;
};

export function OrderTrackingForm({
  orderId,
  shippingCarrier,
  trackingNumber,
  status,
  shippingAddress,
  fulfillmentChannel = "auto",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inferred = resolveFulfillmentChannel({
    mode: "auto",
    shippingAddressJson: shippingAddress,
  });

  const [channelMode, setChannelMode] = useState<FulfillmentChannelMode>(
    fulfillmentChannel === "domestic" || fulfillmentChannel === "export"
      ? fulfillmentChannel
      : "auto",
  );

  const effectiveChannel: FulfillmentChannel =
    channelMode === "auto" ? inferred : channelMode;

  const carriers = useMemo(
    () => getCarriersForChannel(effectiveChannel),
    [effectiveChannel],
  );

  const [carrier, setCarrier] = useState(() => {
    const list = getCarriersForChannel(
      fulfillmentChannel === "domestic" || fulfillmentChannel === "export"
        ? fulfillmentChannel
        : inferred,
    );
    if (list.some((c) => c.code === shippingCarrier)) return shippingCarrier;
    return list[0]?.code ?? "other";
  });

  const [tracking, setTracking] = useState(trackingNumber);

  // Keep carrier valid when channel changes
  const carrierOptions = carriers;
  const selectedCarrier = carrierOptions.some((c) => c.code === carrier)
    ? carrier
    : (carrierOptions[0]?.code ?? "other");

  const canConfirmShip = ["paid", "processing"].includes(status);
  const alreadyShipped = status === "shipped" || status === "completed";

  function buildFormData(extra?: Record<string, string>) {
    const fd = new FormData();
    fd.set("shippingCarrier", selectedCarrier);
    fd.set("trackingNumber", tracking.trim());
    fd.set("fulfillmentChannel", channelMode);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    }
    return fd;
  }

  function onDraft(notify: boolean) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await updateOrderTrackingAction(
        orderId,
        buildFormData(notify ? { notifyBuyer: "on" } : undefined),
      );
      if (result && "error" in result && result.error) {
        setError(String(result.error));
        return;
      }
      setSuccess(
        `物流已保存（未改发货状态）${result?.notified ? "，并已通知买家" : ""}`,
      );
      router.refresh();
    });
  }

  function onConfirmShip() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await confirmShipOrderAction(orderId, buildFormData());
      if (result && "error" in result && result.error) {
        setError(String(result.error));
        if ("shipped" in result && result.shipped) router.refresh();
        return;
      }
      setSuccess(
        result?.shipped
          ? `已确认发货${result.notified ? "，并已通知买家" : ""}`
          : `物流已更新${result?.notified ? "，并已通知买家" : ""}`,
      );
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">履约 / 物流</h2>
      <p className="mt-1 text-sm text-stone-500">
        国内与跨境出口共用此面板：按收货国家自动分流承运商，也可手动指定。推荐「确认发货」一步完成。
      </p>

      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-stone-700">履约市场</label>
          <select
            value={channelMode}
            onChange={(e) => {
              const next = e.target.value as FulfillmentChannelMode;
              setChannelMode(next);
              const ch = next === "auto" ? inferred : next;
              const list = getCarriersForChannel(ch);
              if (!list.some((c) => c.code === carrier)) {
                setCarrier(list[0]?.code ?? "other");
              }
            }}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500"
          >
            <option value="auto">
              自动（推断：{fulfillmentChannelLabel(inferred)}）
            </option>
            <option value="domestic">强制 · 国内快递</option>
            <option value="export">强制 · 跨境出口</option>
          </select>
          <p className="mt-1 text-xs text-stone-500">
            当前列表：{fulfillmentChannelLabel(effectiveChannel)}
            {effectiveChannel === "export"
              ? " · 下方可打印商业发票"
              : " · 圆通/中通/顺丰等国内承运商"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">快递公司</label>
          <select
            value={selectedCarrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500"
          >
            {carrierOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.labelZh}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">运单号</label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="例如 SF123… / 国际运单号"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-amber-500"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {canConfirmShip ? (
          <button
            type="button"
            disabled={pending}
            onClick={onConfirmShip}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
          >
            {pending ? "处理中..." : "确认发货（改状态 + 通知买家）"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => onDraft(false)}
          className="rounded-xl border border-stone-300 bg-white px-6 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-60"
        >
          {canConfirmShip ? "仅保存物流（不发货）" : "保存物流信息"}
        </button>
        {alreadyShipped ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onDraft(true)}
            className="rounded-xl border border-stone-300 bg-white px-6 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-60"
          >
            保存并再次通知买家
          </button>
        ) : null}
      </div>

      {canConfirmShip ? (
        <p className="mt-3 text-xs text-stone-500">
          「确认发货」：写入运单 → 标为已发货 → 发邮件。「仅保存」用于预填，不改状态、不发邮件。
        </p>
      ) : null}
    </div>
  );
}
