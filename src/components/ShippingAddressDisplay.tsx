import type { ShippingAddress } from "@/lib/orders";
import { getCountryLabel } from "@/lib/countries";
import type { Locale } from "@/i18n/routing";

type Labels = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postal: string;
  country: string;
};

type Props = {
  address: ShippingAddress;
  title?: string;
  locale?: Locale;
  labels?: Partial<Labels>;
  /** Admin / light surfaces use stone cards */
  variant?: "store" | "admin";
};

const DEFAULT_LABELS_ZH: Labels = {
  name: "收件人",
  phone: "电话",
  email: "邮箱",
  address: "地址",
  city: "城市/邮编",
  postal: "邮编",
  country: "国家/地区",
};

export function ShippingAddressDisplay({
  address,
  title,
  locale = "zh",
  labels,
  variant = "store",
}: Props) {
  const L = { ...DEFAULT_LABELS_ZH, ...labels };
  const countryLabel = getCountryLabel(address.country, locale);
  const cityLine = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ");

  const rows = [
    { label: L.name, value: address.name },
    { label: L.phone, value: address.phone },
    { label: L.email, value: address.email },
    {
      label: L.address,
      value: [address.line1, address.line2].filter(Boolean).join(", "),
    },
    { label: L.city, value: cityLine },
    { label: L.country, value: countryLabel },
  ].filter((row) => row.value);

  const shell =
    variant === "admin"
      ? "rounded-2xl border border-stone-200 bg-white p-5"
      : "rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-5 text-zinc-200";
  const titleClass =
    variant === "admin" ? "font-semibold text-stone-900" : "font-semibold text-zinc-50";
  const dtClass = variant === "admin" ? "text-stone-500" : "text-zinc-400";
  const ddClass =
    variant === "admin" ? "font-medium text-stone-900" : "font-medium text-zinc-100";

  return (
    <div className={shell}>
      {title ? <h3 className={titleClass}>{title}</h3> : null}
      <dl className={`space-y-3 text-sm ${title ? "mt-4" : ""}`}>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4"
          >
            <dt className={dtClass}>{row.label}</dt>
            <dd className={ddClass}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
