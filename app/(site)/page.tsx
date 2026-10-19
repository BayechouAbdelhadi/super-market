import type { Metadata } from "next";
import { getAppSettings } from "@/lib/settings/service";
import { OPENING_HOURS, STORE_LOCATION, STORE_TIME_ZONE } from "@/lib/store/config";
import { DAY_NAMES, getOpeningStatus, type DayIndex } from "@/lib/store/opening-hours";
import { SiteHeader } from "@/components/public/home/SiteHeader";
import { HeroSection } from "@/components/public/home/HeroSection";
import { DepartmentsSection } from "@/components/public/home/DepartmentsSection";
import { PracticalInfoSection } from "@/components/public/home/PracticalInfoSection";
import { LoyaltySection } from "@/components/public/home/LoyaltySection";
import { MobileActionBar } from "@/components/public/home/MobileActionBar";

// Open/closed status depends on the request time
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Super Market Calais — Supermarché de quartier ouvert 7j/7" },
  description:
    "Supermarché de proximité à Calais Saint-Exupéry : volailles fraîches halal, primeur, surgelés, pâtisserie orientale, boissons en pack, relais Pickup et fidélité sans carte.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Super Market Calais",
    description: "Votre supermarché de quartier à Calais, ouvert 7 jours sur 7.",
    type: "website",
    locale: "fr_FR",
    images: ["/super-market-calais-storefront.webp"],
  },
};

const SCHEMA_DAYS: Record<DayIndex, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/** schema.org data so search engines show the address and opening hours. */
function localBusinessJsonLd(store: { storeName: string; address: string; phone: string; email: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: store.storeName,
    address: store.address,
    telephone: store.phone,
    email: store.email,
    image: "/super-market-calais-storefront.webp",
    hasMap: STORE_LOCATION.googleMapsUrl,
    geo: { "@type": "GeoCoordinates", latitude: STORE_LOCATION.coordinates.lat, longitude: STORE_LOCATION.coordinates.lng },
    openingHoursSpecification: (Object.keys(DAY_NAMES).map(Number) as DayIndex[]).flatMap((day) =>
      OPENING_HOURS[day].map((range) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAYS[day],
        opens: range.open,
        closes: range.close,
      }))
    ),
  };
}

export default async function Home() {
  const { store, loyalty } = await getAppSettings();
  const status = getOpeningStatus(new Date(), OPENING_HOURS, STORE_TIME_ZONE);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(store)).replace(/</g, "\\u003c") }}
      />
      <SiteHeader storeName={store.storeName} phone={store.phone} status={status} />
      <HeroSection storeName={store.storeName} tagline={store.tagline} phone={store.phone} status={status} />
      <main className="mx-auto w-full max-w-6xl space-y-16 px-4 pt-16 pb-12 sm:space-y-24 sm:px-6 sm:pt-24 md:pb-16">
        <DepartmentsSection />
        <PracticalInfoSection
          storeName={store.storeName}
          address={store.address}
          phone={store.phone}
          email={store.email}
          status={status}
        />
        <LoyaltySection euroToPointsRatio={loyalty.euroToPointsRatio} />
      </main>
      <MobileActionBar phone={store.phone} />
    </>
  );
}
