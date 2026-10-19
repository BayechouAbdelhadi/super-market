import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { formatPhone, phoneHref } from "@/lib/store/contact";
import { OPENING_HOURS, STORE_LOCATION } from "@/lib/store/config";
import { groupWeek } from "@/lib/store/opening-hours";

interface SiteFooterProps {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
}

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/#rayons", label: "Nos rayons" },
  { href: "/#infos", label: "Infos pratiques" },
  { href: "/#fidelite", label: "Programme fidélité" },
  { href: "/login", label: "Mon compte" },
  { href: "/politique-de-confidentialite", label: "Politique de confidentialité" },
];

const linkClass =
  "rounded-[var(--radius-button)] text-on-color/70 transition-colors hover:text-on-color focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-color";

function ColumnTitle({ children }: { children: string }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wider text-on-color/50">{children}</h2>;
}

function ContactRow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

/**
 * Footer shared by every public page (app/(site)/layout.tsx). Always dark, whatever the color scheme:
 * text uses `on-color` tints over the `footer` token.
 * `shrink-0` is required: a flex item with `overflow-hidden` may otherwise be squeezed to 0px in the column.
 */
export function SiteFooter({ storeName, tagline, address, phone, email }: SiteFooterProps) {
  return (
    <footer className="relative shrink-0 overflow-hidden bg-footer text-on-color">
      {/* Single soft brand glow, top right */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          {/* Brand */}
          <div className="space-y-5 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 rounded-[var(--radius-button)]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-on-color p-0.5">
                <Image src="/logo-hq.png" alt="" width={48} height={48} className="h-full w-full object-contain" />
              </span>
              <span className="text-xl font-bold tracking-tight">{storeName}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-on-color/70">{tagline}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={STORE_LOCATION.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "primary" })}
              >
                <Navigation />
                <span>Itinéraire</span>
              </a>
              {phone && (
                <a
                  href={phoneHref(phone)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-on-color/20 bg-on-color/5 text-on-color hover:border-on-color/40 hover:bg-on-color/10 hover:text-on-color"
                  )}
                >
                  <Phone />
                  <span>Appeler</span>
                </a>
              )}
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <ColumnTitle>Horaires</ColumnTitle>
            <dl className="space-y-3 text-sm">
              {groupWeek(OPENING_HOURS).map((group) => (
                <div key={group.days}>
                  <dt className="font-medium text-on-color">{group.days}</dt>
                  <dd className="tabular-nums text-on-color/70">{group.hours}</dd>
                </div>
              ))}
            </dl>
            <p className="inline-flex items-center gap-2 rounded-full bg-on-color/10 px-3 py-1 text-xs font-medium">
              <Clock aria-hidden className="h-3.5 w-3.5" />
              Ouvert 7 jours sur 7
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <ColumnTitle>Contact</ColumnTitle>
            <ul className="space-y-3 text-sm">
              <ContactRow icon={MapPin}>
                <a href={STORE_LOCATION.googleMapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {address}
                </a>
              </ContactRow>
              {phone && (
                <ContactRow icon={Phone}>
                  <a href={phoneHref(phone)} className={linkClass}>
                    {formatPhone(phone)}
                  </a>
                </ContactRow>
              )}
              {email && (
                <ContactRow icon={Mail}>
                  <a href={`mailto:${email}`} className={linkClass}>
                    {email}
                  </a>
                </ContactRow>
              )}
            </ul>
          </div>

          {/* Navigation */}
          <nav aria-label="Pied de page" className="space-y-4">
            <ColumnTitle>Navigation</ColumnTitle>
            <ul className="space-y-1 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={cn(linkClass, "inline-flex min-h-8 items-center")}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-on-color/10 pt-6 text-sm text-on-color/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {storeName}. Tous droits réservés.
          </p>
          <p>Relais Pickup La Poste · CB, sans contact, Apple Pay, Google Pay</p>
        </div>
      </div>
    </footer>
  );
}
