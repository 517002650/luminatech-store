"use client";

import { ExternalLink } from "lucide-react";
import {
  getCarrierLabel,
  getTrackingUrl,
  hasTrackingInfo,
} from "@/lib/shipping-tracking";

type Props = {
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  locale?: "zh" | "en";
  /** Compact link for tables */
  compact?: boolean;
  className?: string;
};

/**
 * Free logistics lookup via public carrier / 17TRACK pages (no paid API).
 */
export function TrackingLink({
  shippingCarrier,
  trackingNumber,
  locale = "zh",
  compact = false,
  className = "",
}: Props) {
  if (!hasTrackingInfo({ trackingNumber })) {
    return <span className={`text-stone-400 ${className}`}>—</span>;
  }

  const number = trackingNumber!.trim();
  const carrier = shippingCarrier || "other";
  const url = getTrackingUrl(carrier, number, locale);
  const label = getCarrierLabel(carrier, locale);

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
        title={`${label} · 打开物流查询（免费）`}
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
      <p className="text-xs text-stone-500">
        跳转承运商或 17TRACK 官网查询，无需付费接口。
      </p>
    </div>
  );
}
