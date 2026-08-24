import { Link } from "@/i18n/routing";
import { SafeImage } from "@/components/SafeImage";
import { ProductRating } from "@/components/ProductRating";
import { formatPrice } from "@/lib/format";

type ProductCardProps = {
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
  avgRating?: number;
  reviewCount?: number;
};

export function ProductCard({
  slug,
  name,
  price,
  image,
  category,
  avgRating,
  reviewCount,
}: ProductCardProps) {
  return (
    <Link
      href={`/products/${slug}`}
      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-sm transition hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-800">
        <SafeImage
          src={image}
          alt={name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
          {category}
        </p>
        <h3 className="mt-1 font-semibold text-zinc-100">{name}</h3>
        {avgRating != null && reviewCount != null && reviewCount > 0 && (
          <div className="mt-2">
            <ProductRating avg={avgRating} count={reviewCount} />
          </div>
        )}
        <p className="mt-2 text-lg font-bold text-zinc-50">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}
