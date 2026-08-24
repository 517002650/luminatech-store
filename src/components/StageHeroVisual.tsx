/** CSS-only stage lighting hero illustration — no external images. */
export function StageHeroVisual() {
  return (
    <div className="stage-hero-visual relative mx-auto aspect-square max-w-md lg:max-w-none">
      <div className="absolute inset-0 rounded-3xl bg-zinc-900/80 ring-1 ring-zinc-700/50" />

      {/* Stage floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-3xl bg-gradient-to-t from-zinc-950 to-zinc-900" />
      <div className="absolute bottom-[32%] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Light beams */}
      <div className="stage-beam stage-beam-cyan absolute bottom-[32%] left-[18%] h-[55%] w-16 origin-bottom -rotate-[28deg] opacity-70" />
      <div className="stage-beam stage-beam-violet absolute bottom-[32%] left-[42%] h-[62%] w-20 origin-bottom rotate-[5deg] opacity-60" />
      <div className="stage-beam stage-beam-fuchsia absolute bottom-[32%] right-[18%] h-[58%] w-16 origin-bottom rotate-[32deg] opacity-65" />

      {/* Fixture heads */}
      <div className="absolute bottom-[30%] left-[14%] h-5 w-8 rounded-sm bg-zinc-700 ring-1 ring-zinc-600" />
      <div className="absolute bottom-[30%] left-[44%] h-6 w-10 rounded-sm bg-zinc-700 ring-1 ring-zinc-600" />
      <div className="absolute bottom-[30%] right-[14%] h-5 w-8 rounded-sm bg-zinc-700 ring-1 ring-zinc-600" />

      {/* Lighting console */}
      <div className="absolute bottom-[8%] left-1/2 w-[72%] -translate-x-1/2">
        <div className="rounded-xl bg-zinc-800 p-3 ring-1 ring-zinc-600/80 shadow-2xl shadow-cyan-500/10">
          <div className="mb-2 flex gap-1">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-sm bg-gradient-to-b from-cyan-400/80 to-cyan-600/40"
                style={{ opacity: 0.4 + (i % 3) * 0.2 }}
              />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-md ${
                  i % 4 === 0
                    ? "bg-fuchsia-500/30 ring-1 ring-fuchsia-400/40"
                    : i % 3 === 0
                      ? "bg-cyan-500/25 ring-1 ring-cyan-400/30"
                      : "bg-zinc-700/80"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-zinc-700">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
          </div>
        </div>
      </div>

      {/* Laser dots */}
      <div className="absolute left-[25%] top-[18%] h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_12px_4px_rgba(74,222,128,0.6)]" />
      <div className="absolute right-[28%] top-[22%] h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_10px_3px_rgba(248,113,113,0.5)]" style={{ animationDelay: "0.5s" }} />
      <div className="absolute left-[55%] top-[12%] h-1 w-1 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.5)]" style={{ animationDelay: "1s" }} />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/10" />
    </div>
  );
}
