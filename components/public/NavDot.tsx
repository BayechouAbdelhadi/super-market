import { cn } from "cn";

/**
 * Small red dot drawing the eye to a navigation entry (e.g. "Actualités"). Pulses softly,
 * except for visitors who ask for reduced motion. Decorative: the link text says where it goes.
 */
export function NavDot({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none relative flex size-2", className)}>
      <span className="absolute inline-flex size-2 rounded-full bg-danger opacity-75 motion-safe:animate-ping" />
      <span className="relative inline-flex size-2 rounded-full bg-danger" />
    </span>
  );
}
