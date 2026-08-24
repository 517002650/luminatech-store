type ContentSection = {
  title: string;
  body: string;
};

type Props = {
  title: string;
  subtitle?: string;
  sections: ContentSection[];
  children?: React.ReactNode;
};

export function ContentPage({ title, subtitle, sections, children }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 text-lg text-zinc-400">{subtitle}</p>}
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-zinc-100">{section.title}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-zinc-400">
              {section.body.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        {children}
      </div>
    </div>
  );
}
