import { ExternalLink, Truck } from "lucide-react";
import {
  getCarrierLabel,
  getTrackingUrl,
  hasTrackingInfo,
} from "@/lib/shipping-tracking";
import { darkPanelClass, darkLabelClass } from "@/lib/dark-surface-styles";
import type { Locale } from "@/i18n/routing";

type Props = {
  locale: Locale;
  status: string;
  shippingCarrier: string;
  trackingNumber: string;
  labels: {
    title: string;
    carrier: string;
    trackingNumber: string;
    trackShipment: string;
    pending: string;
  };
};

export function OrderTrackingInfo({
  locale,
  status,
  shippingCarrier,
  trackingNumber,
  labels,
}: Props) {
  const showBlock =
    hasTrackingInfo({ trackingNumber }) ||
    status === "shipped" ||
    status === "completed";

  if (!showBlock) return null;

  const trackingUrl = getTrackingUrl(shippingCarrier, trackingNumber);
  const hasNumber = hasTrackingInfo({ trackingNumber });

  return (
    <div className={`mt-8 p-6 ${darkPanelClass}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30">
          <Truck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-zinc-50">{labels.title}</h2>

          {hasNumber ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className={darkLabelClass}>{labels.carrier}</dt>
                <dd className="mt-1 font-medium text-zinc-100">
                  {getCarrierLabel(shippingCarrier, locale)}
                </dd>
              </div>
              <div>
                <dt className={darkLabelClass}>{labels.trackingNumber}</dt>
                <dd className="mt-1 break-all font-mono text-zinc-100">
                  {trackingNumber}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">{labels.pending}</p>
          )}

          {hasNumber && trackingUrl ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white"
            >
              {labels.trackShipment}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
