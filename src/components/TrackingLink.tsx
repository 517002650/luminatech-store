"use client";

import { ExternalLink } from "lucide-react";
import {
  getCarrierLabel,
  getTrackingUrl,
  hasTrackingInfo,
  phoneLast4,
} from "@/lib/shipping-tracking";

type Props = {
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  /** Recipient phone — used for SF Express (last 4 digits). */
  phone?: string | null;
  locale?: "zh" | "en";
  /** Compact link for tables */
  compact?: boolean;
  className?: string;
};

/**
 * Free logistics lookup via public carrier / 快递100 / 17TRACK pages (no paid API).
 */
export function TrackingLink({
  shippingCarrier,
  trackingNumber,
  phone,
  locale = "zh",
  compact = false,
  className = "",
}: Props) {
  if (!hasTrackingInfo({ trackingNumber })) {
    return <span className={`text-stone-400 ${className}`}>—</span>;
  }

  const number = trackingNumber!.trim();
  const carrier = shippingCarrier || "other";
  if (carrier === "digital") {
    return (
      <span className={`text-xs font-medium text-emerald-700 ${className}`}>
        在线交付 · 无需物流
      </span>
    );
  }

  const url = getTrackingUrl(carrier, number, locale, { phone });
  const label = getCarrierLabel(carrier, locale);
  const sfNeedsPhone = carrier === "sf" && !phoneLast4(phone);

  if (!url) {
    return (
      <span className={`font-mono text-xs text-stone-600 ${className}`}>
        {number}
      </span>
    );
  }

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={
          sfNeedsPhone
            ? `${label} · 顺丰查询需手机后四位，请打开后补填`
            : `${label} · 打开物流查询（免费）`
        }
        className={`inline-flex max-w-[11rem] items-center gap-1 truncate font-mono text-xs font-medium text-amber-800 underline-offset-2 hover:underline ${className}`}
      >
        <span className="truncate">{number}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
      </a>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm text-stone-600">
        {label}
        <span className="mx-1.5 text-stone-300">·</span>
        <span className="font-mono text-stone-900">{number}</span>
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
      >
        查询物流轨迹
        <ExternalLink className="h-4 w-4" />
      </a>
      {carrier === "sf" ? (
        <p className="text-xs text-amber-800">
          {phoneLast4(phone)
            ? `顺丰需验证手机号：已自动带上收件人手机后四位 ${phoneLast4(phone)}。`
            : "顺丰官网深链常失效；已改用快递100。若仍无法查到，请在打开的页面补填收件人手机后四位。"}
        </p>
      ) : (
        <p className="text-xs text-stone-500">
          跳转承运商或快递100 / 17TRACK 官网查询，无需付费接口。
        </p>
      )}
    </div>
  );
}
