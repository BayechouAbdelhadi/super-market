import type { ReactNode } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";

const PERKS = ["Aucune carte à présenter en caisse", "Des points à chaque achat", "Des remises immédiates"];

/** Tone of the icon shown above the title on result screens (email sent, link expired…). */
type IconTone = "success" | "danger" | "info";

const ICON_TONES: Record<IconTone, string> = {
  success: "bg-success-subtle text-success-text border-success-border",
  danger: "bg-danger-subtle text-danger-text border-danger-border",
  info: "bg-info-subtle text-info-text border-info-border",
};

interface AuthShellProps {
  title: ReactNode;
  description?: ReactNode;
  /** Optional status icon above the title */
  icon?: LucideIcon;
  iconTone?: IconTone;
  children: ReactNode;
  /** Links under the card ("Retour à la connexion"…) */
  footer?: ReactNode;
  /** Show the loyalty photo panel on desktop (off for pages unrelated to the account, e.g. email preferences) */
  withPhoto?: boolean;
}

/**
 * Frame of the account pages (login, signup, password, activation): title and form card on the left,
 * a store photo with the loyalty promise on the right (desktop only).
 * The photo panel keeps fixed light-on-dark contrast: its text sits on an image, not on a theme surface.
 */
export function AuthShell({
  title,
  description,
  icon: Icon,
  iconTone = "info",
  children,
  footer,
  withPhoto = true,
}: AuthShellProps) {
  return (
    <div className="w-full flex-1">
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl gap-12 px-4 py-10 sm:px-6 md:py-16",
          withPhoto && "lg:grid-cols-2 lg:items-center lg:gap-16"
        )}
      >
        <div className={cn("mx-auto w-full max-w-md space-y-8", withPhoto && "lg:mx-0")}>
          <div className="space-y-3">
            {Icon && (
              <span
                className={cn(
                  "mb-2 flex h-12 w-12 items-center justify-center rounded-full border",
                  ICON_TONES[iconTone]
                )}
              >
                <Icon aria-hidden className="h-6 w-6" />
              </span>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-text">{title}</h1>
            {description && <p className="text-base leading-relaxed text-text-muted">{description}</p>}
          </div>

          <Card padded="lg">{children}</Card>

          {footer && <div className="flex flex-col items-center gap-3 text-sm">{footer}</div>}
        </div>

        {withPhoto && (
          <aside className="relative hidden aspect-[4/5] max-h-[640px] w-full overflow-hidden rounded-[var(--radius-dialog)] bg-scrim lg:block">
            <Image
              src="/categories/fruits-legumes-sample.jpg"
              alt=""
              fill
              sizes="50vw"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-4 p-8 text-on-color">
              <p className="text-sm font-semibold uppercase tracking-wider text-on-color/70">Programme fidélité</p>
              <p className="text-2xl font-bold leading-snug tracking-tight">
                Chaque euro dépensé dans votre magasin vous rapporte des points.
              </p>
              <ul className="space-y-2">
                {PERKS.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm font-medium text-on-color/90">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-on-color/20">
                      <Check aria-hidden className="h-3 w-3" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/** Secondary text link used under the auth card. */
export const authLinkClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] px-2 font-medium text-text-muted transition-colors hover:text-text";
