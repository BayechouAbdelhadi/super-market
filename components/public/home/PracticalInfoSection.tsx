import type { LucideIcon } from "lucide-react";
import { Bus, CalendarX, CircleParking, CreditCard, Mail, MapPin, Navigation, Package, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { formatPhone, phoneHref } from "@/lib/store/contact";
import { STORE_ACCESS, STORE_LOCATION } from "@/lib/store/config";
import {
  DAY_NAMES,
  WEEK_ORDER,
  formatClosureDates,
  formatDayHours,
  type ExceptionalClosure,
  type OpeningStatus,
  type WeeklySchedule,
} from "@/lib/store/opening-hours";
import { OpenStatus } from "./OpenStatus";
import { SectionHeading } from "./SectionHeading";

const ACCESS_TIPS: { icon: LucideIcon; label: string; text: string }[] = [
  { icon: MapPin, label: "Repère", text: STORE_ACCESS.landmark },
  { icon: Bus, label: "Transports", text: STORE_ACCESS.transport },
  { icon: CircleParking, label: "Stationnement", text: STORE_ACCESS.parking },
];

const SERVICES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Package,
    title: "Point relais Pickup",
    text: "Déposez et retirez vos colis La Poste, Chronopost et partenaires.",
  },
  {
    icon: CreditCard,
    title: "Tous les paiements",
    text: "Carte bancaire, sans contact, Apple Pay, Google Pay et espèces.",
  },
];

interface PracticalInfoSectionProps {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  status: OpeningStatus;
  weekly: WeeklySchedule;
  /** Closures to announce, soonest first */
  upcomingClosures: ExceptionalClosure[];
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-surface-hover text-text">
      <Icon aria-hidden className="h-5 w-5" />
    </span>
  );
}

export function PracticalInfoSection({
  storeName,
  address,
  phone,
  email,
  status,
  weekly,
  upcomingClosures,
}: PracticalInfoSectionProps) {
  const contacts = [
    { icon: MapPin, label: address, href: STORE_LOCATION.googleMapsUrl, external: true },
    ...(phone ? [{ icon: Phone, label: formatPhone(phone), href: phoneHref(phone), external: false }] : []),
    ...(email ? [{ icon: Mail, label: email, href: `mailto:${email}`, external: false }] : []),
  ];

  return (
    <section id="infos" aria-labelledby="infos-title" className="scroll-mt-24 space-y-8">
      <SectionHeading
        id="infos-title"
        eyebrow="Infos pratiques"
        title="Venir au magasin"
        description="Facilement accessible en voiture, en bus ou à pied, avec stationnement gratuit."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Map */}
        <Card padded={false} className="overflow-hidden lg:col-span-3">
          <div className="h-72 bg-surface-hover sm:h-96 lg:h-auto lg:min-h-80 lg:flex-1">
            <iframe
              title={`Carte : ${storeName}, ${address}`}
              src={STORE_LOCATION.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
          <div className="space-y-5 border-t border-border p-5 sm:p-6">
            <ul className="grid gap-4 sm:grid-cols-3">
              {ACCESS_TIPS.map(({ icon: Icon, label, text }) => (
                <li key={label} className="flex gap-3">
                  <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
                  <div>
                    <p className="text-sm font-semibold text-text">{label}</p>
                    <p className="text-sm text-text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={STORE_LOCATION.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "primary" })}
              >
                <Navigation />
                <span>Ouvrir dans Google Maps</span>
              </a>
              <a
                href={STORE_LOCATION.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "secondary" })}
              >
                Ouvrir dans Waze
              </a>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Hours */}
          <Card padded="md" className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-text">Horaires</h3>
              <OpenStatus initial={status} variant="compact" className="text-xs" />
            </div>
            <dl className="space-y-1">
              {WEEK_ORDER.map((day) => {
                const isToday = day === status.dayIndex;
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-[var(--radius-button)] px-3 py-2 text-sm",
                      isToday ? "bg-surface-hover font-semibold text-text" : "text-text-muted"
                    )}
                  >
                    <dt className="flex items-center gap-2">
                      {DAY_NAMES[day]}
                      {isToday && <span className="sr-only">(aujourd&apos;hui)</span>}
                      {isToday && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </dt>
                    <dd className="text-right tabular-nums">{formatDayHours(weekly[day])}</dd>
                  </div>
                );
              })}
            </dl>
            {upcomingClosures.length > 0 && (
              <div className="space-y-2 rounded-[var(--radius-button)] border border-warning-border bg-warning-subtle p-3 text-sm text-warning-text">
                <p className="flex items-center gap-2 font-semibold">
                  <CalendarX aria-hidden className="h-4 w-4 shrink-0" />
                  Fermetures exceptionnelles
                </p>
                <ul className="space-y-1">
                  {upcomingClosures.map((closure) => (
                    <li key={closure.id} className="flex justify-between gap-4">
                      <span className="tabular-nums">{formatClosureDates(closure)}</span>
                      {closure.reason && <span className="text-right">{closure.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Contact */}
          <Card padded="md" className="gap-2">
            <h3 className="mb-2 text-lg font-semibold tracking-tight text-text">Contact</h3>
            <ul className="-mx-2">
              {contacts.map(({ icon, label, href, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-button)] px-2 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
                  >
                    <IconTile icon={icon} />
                    <span className="min-w-0 break-words">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <ul className="grid gap-6 sm:grid-cols-2">
        {SERVICES.map(({ icon, title, text }) => (
          <li key={title} className="flex gap-4">
            <IconTile icon={icon} />
            <div>
              <p className="text-base font-semibold text-text">{title}</p>
              <p className="text-sm text-text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
