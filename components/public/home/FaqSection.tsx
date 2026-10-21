import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/store/faq";
import { SectionHeading } from "./SectionHeading";

interface FaqSectionProps {
  items: FaqItem[];
  /** Anchor of the section; the heading id is derived from it. */
  id?: string;
  title?: string;
}

/**
 * Frequently asked questions as a native accordion (`<details>`: keyboard and screen reader friendly, no JS).
 * The same items are sent to search engines as FAQPage data by the page using it.
 */
export function FaqSection({ items, id = "faq", title = "Tout savoir avant de venir" }: FaqSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 space-y-8">
      <SectionHeading id={`${id}-title`} eyebrow="Questions fréquentes" title={title} align="center" />
      <div className="mx-auto max-w-3xl divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
        {items.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[var(--radius-card)] px-4 py-3 text-left text-base font-semibold text-text outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-6 [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                aria-hidden
                className="size-5 shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-4 text-base leading-relaxed text-text-muted sm:px-6">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
