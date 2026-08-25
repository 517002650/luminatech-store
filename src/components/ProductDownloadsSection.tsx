"use client";

import { useTranslations } from "next-intl";
import { Download, History, Star } from "lucide-react";
import {
  DOWNLOAD_TYPES,
  formatFileSize,
  type DownloadType,
} from "@/lib/product-downloads";

export type StoreDownloadItem = {
  id: string;
  type: string;
  version: string;
  title: string;
  notes: string;
  fileName: string;
  fileSize: number;
  isLatest: boolean;
  createdAt: string;
};

type Props = {
  items: StoreDownloadItem[];
  /** Hide the large section header (useful when embedding under an order). */
  compact?: boolean;
  title?: string;
  subtitle?: string;
};

export function ProductDownloadsSection({
  items,
  compact = false,
  title,
  subtitle,
}: Props) {
  const t = useTranslations("product");

  if (items.length === 0) return null;

  const grouped = DOWNLOAD_TYPES.map((type) => ({
    type,
    rows: items.filter((i) => i.type === type),
  })).filter((g) => g.rows.length > 0);

  return (
    <section
      className={`rounded-2xl border border-cyan-500/20 bg-zinc-900/60 p-6 ${
        compact ? "mt-0" : "mt-12"
      }`}
    >
      {!compact ? (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/30">
            <Download className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-50">
              {title ?? t("downloadsTitle")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {subtitle ?? t("downloadsSubtitle")}
            </p>
          </div>
        </div>
      ) : null}

      <div className={`space-y-8 ${compact ? "" : "mt-8"}`}>
        {grouped.map(({ type, rows }) => (
          <div key={type}>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
              {t(`downloadTypes.${type as DownloadType}`)}
              <span className="font-normal text-zinc-600">({rows.length})</span>
            </h3>
            <ul className="mt-3 divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 bg-zinc-950/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100">
                      {row.title}
                      <span className="ml-2 text-sm font-normal text-zinc-500">
                        v{row.version}
                      </span>
                      {row.isLatest ? (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-300">
                          <Star className="h-3 w-3" />
                          {t("downloadLatest")}
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-zinc-500">
                          <History className="h-3 w-3" />
                          {t("downloadHistory")}
                        </span>
                      )}
                    </p>
                    {row.notes ? (
                      <p className="mt-1 text-sm text-zinc-500">{row.notes}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-600">
                      {row.fileName} · {formatFileSize(row.fileSize)} ·{" "}
                      {new Date(row.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={`/api/downloads/${row.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-violet-500"
                  >
                    <Download className="h-4 w-4" />
                    {t("downloadButton")}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
