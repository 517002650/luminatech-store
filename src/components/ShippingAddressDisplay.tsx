import type { ShippingAddress } from "@/lib/orders";
import { formatShippingAddress } from "@/lib/orders";

type Props = {
  address: ShippingAddress;
  title?: string;
};

export function ShippingAddressDisplay({ address, title }: Props) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      {title && <h3 className="font-semibold text-stone-900">{title}</h3>}
      <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-600 ${title ? "mt-3" : ""}`}>
        {formatShippingAddress(address)}
      </pre>
    </div>
  );
}
