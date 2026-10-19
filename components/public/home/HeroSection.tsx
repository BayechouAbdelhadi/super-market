import Image from "next/image";
import { Clock, Gift, Navigation, Package, Phone, Store } from "lucide-react";
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
  storeName: string;
  tagline: string;
  phone: string;
  status: OpeningStatus;
}

/**
 * Full-width storefront banner carrying the page title, then the intro and main actions.
 * Text on the photo keeps fixed light-on-dark contrast: it sits on an image, not on a theme surface.
 */
export function HeroSection({ storeName, tagline, phone, status }: HeroSectionProps) {
  return (
    <section aria-labelledby="hero-title">
      <div className="relative flex aspect-[4/3] max-h-[520px] min-h-[320px] w-full flex-col justify-end overflow-hidden bg-scrim sm:aspect-[21/9] md:aspect-[24/9]">
        <Image
          src="/super-market-calais-storefront.webp"
          alt={`Devanture du ${storeName}, 205 avenue Antoine de Saint-Exupéry à Calais`}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Darken bottom and left, where the title sits, for contrast on any photo */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-scrim/10 to-scrim/80" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-scrim/60 via-scrim/20 to-transparent" />

        <div className="relative mx-auto w-full max-w-6xl space-y-4 px-4 pb-6 sm:px-6 sm:pb-10 md:pb-12">
          <OpenStatus initial={status} className="bg-surface shadow-md" />
          <h1
            id="hero-title"
            className="max-w-3xl text-3xl font-bold tracking-tight text-on-color drop-shadow-md sm:text-4xl md:text-5xl md:leading-[1.1]"
          >
            {tagline}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-start md:gap-12 md:pt-10">
        <div className="space-y-6">
          <p className="max-w-2xl text-lg leading-relaxed text-text-muted">
            Volailles fraîches, primeur, surgelés, pâtisserie orientale et boissons en pack au meilleur prix, au cœur
            du quartier Saint-Exupéry.
          </p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {FACTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-text">
                <Icon aria-hidden className="h-4 w-4 shrink-0 text-text-muted" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Phones get the same two actions in the bottom bar (MobileActionBar) */}
        <div className="hidden gap-3 md:flex md:flex-col">
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
      </div>
    </section>
  );
}
