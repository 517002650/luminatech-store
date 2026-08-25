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
          a: ({ href, children }) => {
            const hrefStr = typeof href === "string" ? href : "";
            if (isVideoEmbedUrl(hrefStr)) {
              const label =
                typeof children === "string" && children.trim()
                  ? children
                  : "介绍视频";
              return (
                <ProductVideoEmbed
                  url={hrefStr}
                  title={typeof label === "string" ? label : "介绍视频"}
                />
              );
            }
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
