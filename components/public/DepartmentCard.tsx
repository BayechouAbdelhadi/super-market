import type { ReactNode } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/** Accent hue of a department card, taken from the theme tokens. */
export type DepartmentAccent = "primary" | "success" | "warning" | "info";

const ACCENT_CLASSES: Record<DepartmentAccent, { card: string; title: string; highlight: string }> = {
  primary: {
    card: "hover:shadow-primary/10 hover:border-primary/50",
    title: "group-hover:text-primary",
    highlight: "text-primary",
  },
  success: {
    card: "hover:shadow-success/10 hover:border-success/50",
    title: "group-hover:text-success-text",
    highlight: "text-success-text",
  },
  warning: {
    card: "hover:shadow-warning/10 hover:border-warning/50",
    title: "group-hover:text-warning-text",
    highlight: "text-warning-text",
  },
  info: {
    card: "hover:shadow-info/10 hover:border-info/50",
    title: "group-hover:text-info-text",
    highlight: "text-info-text",
  },
};

export interface DepartmentCardProps {
  title: string;
  description: ReactNode;
  image: { src: string; alt: string };
  /** Label on the photo, top right */
  badge: string;
  emoji: string;
  /** Caption next to the emoji, on the photo */
  caption: string;
  /** Footer highlight (with a check icon) and footer tag */
  highlight: string;
  tag: string;
  /** Hover border, title hover and highlight color */
  accent: DepartmentAccent;
  /** Highlight color when it differs from the accent */
  highlightAccent?: DepartmentAccent;
}

/**
 * One department ("rayon") of the store on the public home page.
 * Elements on the photo keep fixed light-on-dark contrast: they sit on an image, not on a theme surface.
 */
export function DepartmentCard({
  title,
  description,
  image,
  badge,
  emoji,
  caption,
  highlight,
  tag,
  accent,
  highlightAccent = accent,
}: DepartmentCardProps) {
  const accentClasses = ACCENT_CLASSES[accent];

  return (
    <Card
      padded={false}
      className={`flex flex-col hover:-translate-y-1.5 hover:shadow-xl ${accentClasses.card} transition-all duration-300 border-[var(--color-border)] group bg-[var(--color-surface)] overflow-hidden rounded-2xl`}
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-hover">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/60 via-transparent to-scrim/20" />
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="neutral" size="sm" className="shadow-md backdrop-blur-md bg-on-color/95 text-scrim border-on-color/60 font-bold">
            {badge}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl bg-on-color/95 backdrop-blur-md border border-on-color/80 shadow-md flex items-center justify-center text-xl">
            {emoji}
          </span>
          <span className="text-on-color text-xs font-bold drop-shadow-md">{caption}</span>
        </div>
      </div>
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className={`text-lg font-bold text-[var(--color-text)] tracking-tight ${accentClasses.title} transition-colors`}>
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">{description}</p>
        </div>
        <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
          <span className={`flex items-center gap-1.5 ${ACCENT_CLASSES[highlightAccent].highlight} font-bold`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {highlight}
          </span>
          <span className="text-[11px] bg-surface-hover px-2 py-0.5 rounded-full">{tag}</span>
        </div>
      </div>
    </Card>
  );
}
