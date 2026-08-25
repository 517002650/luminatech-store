import { ExternalLink, Truck } from "lucide-react";
import {
  getCarrierLabel,
  getTrackingUrl,
  hasTrackingInfo,
  phoneLast4,
} from "@/lib/shipping-tracking";
import { darkPanelClass, darkLabelClass } from "@/lib/dark-surface-styles";
import type { Locale } from "@/i18n/routing";

type Props = {
  locale: Locale;
  status: string;
  shippingCarrier: string;
  trackingNumber: string;
  /** Recipient phone for SF Express verification. */
  phone?: string;
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
  phone,
  labels,
}: Props) {
  const showBlock =
    hasTrackingInfo({ trackingNumber }) ||
    shippingCarrier === "digital" ||
    status === "shipped" ||
    status === "completed";

  if (!showBlock) return null;

  if (shippingCarrier === "digital") {
    return (
      <div className={`mt-8 p-6 ${darkPanelClass}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30">
            <Truck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-zinc-50">{labels.title}</h2>
            <p className="mt-2 text-sm text-emerald-200/90">
              {locale === "zh"
                ? "本单为在线交付，无需物流。请在下方下载附件。"
                : "This order uses online delivery — no shipping. Download files below."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const trackingUrl = getTrackingUrl(
    shippingCarrier,
    trackingNumber,
    locale === "zh" ? "zh" : "en",
    { phone },
  );
  const hasNumber = hasTrackingInfo({ trackingNumber });
  const sfHint =
    shippingCarrier === "sf" && locale === "zh"
      ? phoneLast4(phone)
        ? `顺丰查询已带上手机后四位 ${phoneLast4(phone)}`
        : "顺丰查询可能需要收件人手机后四位，打开后请按页面提示补填"
      : null;

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
                  {getCarrierLabel(shippingCarrier, locale === "zh" ? "zh" : "en")}
                </dd>
              </div>
              <div>
                <dt className={darkLabelClass}>{labels.trackingNumber}</dt>
                <dd className="mt-1 break-all font-mono text-zinc-100">
                  {trackingUrl ? (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 underline-offset-2 hover:underline"
                    >
                      {trackingNumber}
                    </a>
                  ) : (
                    trackingNumber
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">{labels.pending}</p>
          )}

          {hasNumber && trackingUrl ? (
            <>
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white"
              >
                {labels.trackShipment}
                <ExternalLink className="h-4 w-4" />
              </a>
              {sfHint ? (
                <p className="mt-2 text-xs text-amber-200/80">{sfHint}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
