import Image from "next/image";
import { Clock, Gift, MapPin, Navigation, Package, Phone, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatPhone, phoneHref } from "@/lib/store/contact";
import { STORE_LOCATION } from "@/lib/store/config";
import type { OpeningStatus } from "@/lib/store/opening-hours";
import { OpenStatus } from "./OpenStatus";

const FACTS = [
  { icon: Clock, label: "Ouvert 7j/7" },
  { icon: Store, label: "+300 m² de rayons" },
  { icon: Package, label: "Relais Pickup La Poste" },
  { icon: Gift, label: "Fidélité sans carte" },
];

interface HeroSectionProps {
  tagline: string;
  address: string;
  phone: string;
  status: OpeningStatus;
}

export function HeroSection({ tagline, address, phone, status }: HeroSectionProps) {
  return (
    <section aria-labelledby="hero-title" className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
      <div className="space-y-6">
        <OpenStatus initial={status} />

        <div className="space-y-4">
          <h1 id="hero-title" className="text-4xl font-bold tracking-tight text-text sm:text-5xl lg:leading-[1.1]">
            {tagline}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-text-muted">
            Volailles fraîches, primeur, surgelés, pâtisserie orientale et boissons en pack au meilleur prix, au cœur
            du quartier Saint-Exupéry.
          </p>
        </div>

        {/* Phones get the same two actions in the bottom bar (MobileActionBar) */}
        <div className="hidden gap-3 md:flex md:flex-wrap">
          <a
            href={STORE_LOCATION.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            <Navigation />
            <span>Itinéraire</span>
          </a>
          {phone && (
            <a href={phoneHref(phone)} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <Phone />
              <span>Appeler le {formatPhone(phone)}</span>
            </a>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-6">
          {FACTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm font-medium text-text">
              <Icon aria-hidden className="h-4 w-4 shrink-0 text-text-muted" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-dialog)] border border-border bg-surface-hover">
          <Image
            src="/super-market-calais-storefront.webp"
            alt="Devanture du Super Market, 205 avenue Antoine de Saint-Exupéry à Calais"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 shadow-lg sm:right-auto sm:max-w-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-surface-hover text-text">
            <MapPin aria-hidden className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">Votre magasin à Calais</p>
            <p className="truncate text-sm text-text-muted">{address}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
