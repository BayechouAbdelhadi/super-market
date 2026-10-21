import type { ReactNode } from "react";
import { cn } from "cn";

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  /** "center" for a section whose content is centered too (e.g. the news card). */
  align?: "start" | "center";
}

/** Eyebrow + title + optional lead paragraph opening a home page section. `id` labels the section. */
export function SectionHeading({ id, eyebrow, title, description, align = "start" }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl space-y-2", align === "center" && "mx-auto text-center")}>
      <p className="text-sm font-semibold text-primary-ink">{eyebrow}</p>
      <h2 id={id} className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
        {title}
      </h2>
      {description && <p className="text-base text-text-muted leading-relaxed">{description}</p>}
    </div>
  );
}
