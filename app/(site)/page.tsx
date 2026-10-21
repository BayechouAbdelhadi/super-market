import type { Metadata } from "next";
import { getAppSettings } from "@/lib/settings/service";
import { getLatestNewsPost } from "@/lib/news/service";
import { BASE_OPEN_GRAPH, DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME } from "@/lib/seo/config";
import { faqJsonLd, storeJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import { buildStoreFaq } from "@/lib/store/faq";
import { STORE_TIME_ZONE, UPCOMING_CLOSURES_WINDOW_DAYS } from "@/lib/store/config";
import { getOpeningStatus, getUpcomingClosures } from "@/lib/store/opening-hours";
import { getSiteUrl } from "@/lib/utils/app-url";
import { JsonLd } from "@/components/shared/JsonLd";
import { HeroSection } from "@/components/public/home/HeroSection";
import { DepartmentsSection } from "@/components/public/home/DepartmentsSection";
import { LatestNewsSection } from "@/components/public/home/LatestNewsSection";
import { PracticalInfoSection } from "@/components/public/home/PracticalInfoSection";
import { LoyaltySection } from "@/components/public/home/LoyaltySection";
import { FaqSection } from "@/components/public/home/FaqSection";
import { MobileActionBar } from "@/components/public/home/MobileActionBar";

// Open/closed status depends on the request time
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: DEFAULT_TITLE },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    title: SITE_NAME,
    description: "Votre supermarché de quartier à Calais, ouvert 7 jours sur 7.",
    url: "/",
  },
};

export default async function Home() {
  const [{ store, loyalty, hours }, latestNews] = await Promise.all([getAppSettings(), getLatestNewsPost()]);
  const now = new Date();
  const status = getOpeningStatus(now, hours.weekly, STORE_TIME_ZONE, hours.closures);
  const upcomingClosures = getUpcomingClosures(now, hours.closures, STORE_TIME_ZONE, UPCOMING_CLOSURES_WINDOW_DAYS);
  const faq = buildStoreFaq({
    storeName: store.storeName,
    address: store.address,
    weekly: hours.weekly,
    euroToPointsRatio: loyalty.euroToPointsRatio,
  });
  const siteUrl = getSiteUrl();

  return (
    <>
      <JsonLd nodes={[storeJsonLd(store, hours, siteUrl), websiteJsonLd(siteUrl), faqJsonLd(faq)]} />
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
        <FaqSection items={faq} />
      </main>
      <MobileActionBar phone={store.phone} />
    </>
  );
}
