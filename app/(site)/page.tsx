import type { Metadata } from "next";
import { getAppSettings } from "@/lib/settings/service";
import { getLatestNewsPost } from "@/lib/news/service";
import { STORE_LOCATION, STORE_TIME_ZONE, UPCOMING_CLOSURES_WINDOW_DAYS } from "@/lib/store/config";
import {
  DAY_NAMES,
  getOpeningStatus,
  getUpcomingClosures,
  type DayIndex,
  type OpeningHours,
} from "@/lib/store/opening-hours";
import { HeroSection } from "@/components/public/home/HeroSection";
import { DepartmentsSection } from "@/components/public/home/DepartmentsSection";
import { LatestNewsSection } from "@/components/public/home/LatestNewsSection";
import { PracticalInfoSection } from "@/components/public/home/PracticalInfoSection";
import { LoyaltySection } from "@/components/public/home/LoyaltySection";
import { MobileActionBar } from "@/components/public/home/MobileActionBar";

// Open/closed status depends on the request time
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Super Market Calais — Supermarché de quartier ouvert 7j/7" },
  description:
    "Supermarché de proximité à Calais Saint-Exupéry : produits méditerranéens (Turquie, Maroc), volailles fraîches halal, primeur, surgelés, pâtisserie orientale, boissons en pack, relais Pickup et fidélité sans carte.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Super Market Calais",
    description: "Votre supermarché de quartier à Calais, ouvert 7 jours sur 7.",
    type: "website",
    locale: "fr_FR",
    images: ["/super-market-calais-banner-hd.webp"],
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
function localBusinessJsonLd(
  store: { storeName: string; address: string; phone: string; email: string },
  hours: OpeningHours
) {
  return {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: store.storeName,
    address: store.address,
    telephone: store.phone,
    email: store.email,
    image: "/super-market-calais-banner-hd.webp",
    hasMap: STORE_LOCATION.googleMapsUrl,
    geo: { "@type": "GeoCoordinates", latitude: STORE_LOCATION.coordinates.lat, longitude: STORE_LOCATION.coordinates.lng },
    openingHoursSpecification: (Object.keys(DAY_NAMES).map(Number) as DayIndex[]).flatMap((day) =>
      hours.weekly[day].map((range) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAYS[day],
        opens: range.open,
        closes: range.close,
      }))
    ),
    // Exceptional closures: same day as opens/closes "00:00" means closed (schema.org convention)
    specialOpeningHoursSpecification: hours.closures.map((closure) => ({
      "@type": "OpeningHoursSpecification",
      validFrom: closure.startDate,
      validThrough: closure.endDate,
      opens: "00:00",
      closes: "00:00",
    })),
  };
}

export default async function Home() {
  const [{ store, loyalty, hours }, latestNews] = await Promise.all([getAppSettings(), getLatestNewsPost()]);
  const now = new Date();
  const status = getOpeningStatus(now, hours.weekly, STORE_TIME_ZONE, hours.closures);
  const upcomingClosures = getUpcomingClosures(now, hours.closures, STORE_TIME_ZONE, UPCOMING_CLOSURES_WINDOW_DAYS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(store, hours)).replace(/</g, "\\u003c") }}
      />
      <HeroSection storeName={store.storeName} tagline={store.tagline} phone={store.phone} status={status} />
      <main className="mx-auto w-full max-w-6xl space-y-16 px-4 pt-16 pb-12 sm:space-y-24 sm:px-6 sm:pt-24 md:pb-16">
        <DepartmentsSection />
        {/* Hidden until the first post is published */}
        {latestNews && <LatestNewsSection post={latestNews} storeName={store.storeName} now={now} />}
        <PracticalInfoSection
          storeName={store.storeName}
          address={store.address}
          phone={store.phone}
          email={store.email}
          status={status}
          weekly={hours.weekly}
          upcomingClosures={upcomingClosures}
        />
        <LoyaltySection euroToPointsRatio={loyalty.euroToPointsRatio} />
      </main>
      <MobileActionBar phone={store.phone} />
    </>
  );
}
