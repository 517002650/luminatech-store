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
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <SafeImage
          src={image}
          alt={name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-600">
          {category}
        </p>
        <h3 className="mt-1 font-semibold text-stone-900">{name}</h3>
        {avgRating != null && reviewCount != null && reviewCount > 0 && (
          <div className="mt-2">
            <ProductRating avg={avgRating} count={reviewCount} />
          </div>
        )}
        <p className="mt-2 text-lg font-bold text-stone-800">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}
