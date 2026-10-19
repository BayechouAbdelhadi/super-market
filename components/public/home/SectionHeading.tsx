import type { ReactNode } from "react";

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
}

/** Eyebrow + title + optional lead paragraph opening a home page section. `id` labels the section. */
export function SectionHeading({ id, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl space-y-2">
      <p className="text-sm font-semibold text-primary-ink">{eyebrow}</p>
      <h2 id={id} className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
        {title}
      </h2>
      {description && <p className="text-base text-text-muted leading-relaxed">{description}</p>}
    </div>
  );
}
