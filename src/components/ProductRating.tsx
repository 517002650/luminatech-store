import { Star } from "lucide-react";

type Props = {
  avg: number;
  count: number;
  size?: "sm" | "md";
};

export function ProductRating({ avg, count, size = "sm" }: Props) {
  if (count === 0) return null;

  const stars = Math.round(avg);
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${iconSize} ${i <= stars ? "fill-cyan-400 text-cyan-400" : "text-zinc-600"}`}
          />
        ))}
      </div>
      <span className={`text-zinc-500 ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {avg.toFixed(1)} ({count})
      </span>
    </div>
  );
}
