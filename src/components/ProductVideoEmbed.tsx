import { parseVideoEmbedUrl } from "@/lib/video-embed";

type Props = {
  url: string;
  title?: string;
};

export function ProductVideoEmbed({ url, title = "Product video" }: Props) {
  const info = parseVideoEmbedUrl(url);
  if (!info) return null;

  if (info.kind === "video") {
    return (
      <div className="my-4 overflow-hidden rounded-xl border border-zinc-700 bg-black">
        <video
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full"
          src={info.src}
        >
          <a href={info.src} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </video>
      </div>
    );
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-zinc-700 bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          src={info.src}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
