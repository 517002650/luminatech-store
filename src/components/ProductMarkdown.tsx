import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ProductVideoEmbed } from "@/components/ProductVideoEmbed";
import { isVideoEmbedUrl } from "@/lib/video-embed";

type Props = {
  content: string;
};

export function ProductMarkdown({ content }: Props) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Image syntax with a video URL → inline player
          // ![介绍视频](https://youtube.com/...)
          img: ({ src, alt }) => {
            const srcStr = typeof src === "string" ? src : "";
            if (isVideoEmbedUrl(srcStr)) {
              return <ProductVideoEmbed url={srcStr} title={alt || "介绍视频"} />;
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={srcStr}
                alt={alt ?? ""}
                className="my-4 w-full rounded-xl border border-zinc-700"
                loading="lazy"
              />
            );
          },
          // Link syntax always opens in a new tab (including video URLs)
          // [观看介绍](https://youtube.com/...) or [官网](https://example.com)
          a: ({ href, children }) => {
            const hrefStr = typeof href === "string" ? href : "";
            if (!hrefStr) return <>{children}</>;
            return (
              <a
                href={hrefStr}
                className="text-cyan-400 underline hover:text-cyan-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
