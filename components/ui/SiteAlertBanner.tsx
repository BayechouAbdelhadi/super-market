import { Info, OctagonAlert, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import type { BadgeProps } from "@/components/ui/badge";
import { ALERT_LEVEL_LABELS } from "@/lib/alerts/config";
import type { AlertLevel } from "@/lib/alerts/types";

interface LevelStyle {
  icon: LucideIcon;
  /** Banner surface; critical is solid so it reads as more urgent than the tinted levels. */
  className: string;
  badge: NonNullable<BadgeProps["variant"]>;
}

export const ALERT_LEVEL_STYLES: Record<AlertLevel, LevelStyle> = {
  INFO: { icon: Info, className: "bg-info-subtle text-info-text border-info-border", badge: "info" },
  WARNING: { icon: TriangleAlert, className: "bg-warning-subtle text-warning-text border-warning-border", badge: "warning" },
  CRITICAL: { icon: OctagonAlert, className: "bg-[var(--color-danger)] text-on-color border-transparent", badge: "danger" },
};

export interface SiteAlertBannerProps {
  level: AlertLevel;
  message: string;
  /** Exposed as `data-alert-id`, so closed alerts can be hidden before hydration. */
  alertId?: string;
  /** Shows a close button when set. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * One alert strip, full width. Shown at the top of the public site and as the preview in the admin.
 * Critical alerts are announced to screen readers right away; the others politely.
 * With `onDismiss`, a close button sits at the end of the strip.
 */
export function SiteAlertBanner({ level, message, alertId, onDismiss, className }: SiteAlertBannerProps) {
  const { icon: Icon, className: levelClassName } = ALERT_LEVEL_STYLES[level];
  return (
    <div
      role={level === "CRITICAL" ? "alert" : "status"}
      data-alert-id={alertId}
      className={cn("border-b", levelClassName, className)}
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:px-6">
        <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
        <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed break-words">
          <span className="sr-only">{ALERT_LEVEL_LABELS[level]} : </span>
          {message}
        </p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fermer l'annonce"
            title="Fermer"
            className="-my-2.5 -mr-2.5 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-button,12px)] opacity-80 outline-none transition-colors hover:bg-current/10 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
          >
            <X aria-hidden className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
