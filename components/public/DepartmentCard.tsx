import type { ReactNode } from "react";
import Image from "next/image";

export interface DepartmentCardProps {
  title: string;
  description: ReactNode;
  image: { src: string; alt: string };
  /** Short label on the photo, e.g. "N°1 à Calais" */
  badge: string;
  /** Key selling points shown under the title, e.g. ["Arrivage quotidien", "100% Halal"] */
  highlights: string[];
}

/**
 * One department ("rayon") of the store on the public home page: rounded photo, text below, no box.
 * The badge keeps fixed light-on-photo contrast: it sits on an image, not on a theme surface.
 */
export function DepartmentCard({ title, description, image, badge, highlights }: DepartmentCardProps) {
  return (
    <article className="group flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-surface-hover">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute left-3 top-3 rounded-full bg-on-color px-3 py-1 text-xs font-semibold text-scrim shadow-md">
          {badge}
        </span>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold tracking-tight text-text">{title}</h3>
        <p className="text-sm font-medium text-text">{highlights.join(" · ")}</p>
        <p className="text-sm leading-relaxed text-text-muted">{description}</p>
      </div>
    </article>
  );
}
