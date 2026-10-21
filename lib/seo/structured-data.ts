import { STORE_LOCATION, STORE_PAYMENT_METHODS, STORE_SOCIAL } from "@/lib/store/config";
import { formatList } from "@/lib/store/faq";
import { DAY_NAMES, type DayIndex, type OpeningHours } from "@/lib/store/opening-hours";
import { DEFAULT_SHARE_IMAGE, SITE_NAME } from "./config";

/**
 * schema.org JSON-LD builders: what search engines read to show the store card (address, hours, map),
 * breadcrumbs, FAQ answers and news posts. Pure functions: every URL comes out absolute.
 */

export type JsonLd = Record<string, unknown>;

const SCHEMA_DAYS: Record<DayIndex, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const absolute = (siteUrl: string, path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path}`);

/** Stable ids, so the page graphs point at one store and one website. */
export const storeId = (siteUrl: string) => `${siteUrl}/#store`;
const websiteId = (siteUrl: string) => `${siteUrl}/#website`;

/** "06 71 54 05 28" → "+33671540528". Anything not a French number comes back unchanged. */
export function toInternationalPhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (/^0\d{9}$/.test(digits)) return `+33${digits.slice(1)}`;
  if (/^0033\d{9}$/.test(digits)) return `+${digits.slice(2)}`;
  if (/^\+33\d{9}$/.test(digits)) return digits;
  return phone.trim();
}

/** "205 Avenue …, 62100 Calais" → PostalAddress. Falls back to the plain text when the format is unknown. */
export function toPostalAddress(address: string): JsonLd | string {
  const match = address.trim().match(/^(.+?),?\s+(\d{5})\s+([^,]+?)(?:,\s*France)?$/i);
  if (!match) return address.trim();
  const [, street, postalCode, city] = match;
  return {
    "@type": "PostalAddress",
    streetAddress: street.replace(/,\s*$/, "").trim(),
    postalCode,
    addressLocality: city.trim(),
    addressCountry: "FR",
  };
}

export interface StoreFacts {
  storeName: string;
  address: string;
  phone: string;
  email: string;
}

/** The store itself: Google uses it for the knowledge panel and local results. */
export function storeJsonLd(store: StoreFacts, hours: OpeningHours, siteUrl: string): JsonLd {
  return {
    "@type": "GroceryStore",
    "@id": storeId(siteUrl),
    name: store.storeName,
    url: siteUrl,
    logo: absolute(siteUrl, "/logo-hq.png"),
    image: [absolute(siteUrl, DEFAULT_SHARE_IMAGE.url), absolute(siteUrl, "/super-market-calais-banner-hd.webp")],
    address: toPostalAddress(store.address),
    telephone: toInternationalPhone(store.phone),
    email: store.email,
    priceRange: "€",
    currenciesAccepted: "EUR",
    paymentAccepted: formatList(STORE_PAYMENT_METHODS),
    areaServed: { "@type": "City", name: "Calais" },
    sameAs: [STORE_SOCIAL.facebookUrl],
    hasMap: STORE_LOCATION.googleMapsUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: STORE_LOCATION.coordinates.lat,
      longitude: STORE_LOCATION.coordinates.lng,
    },
    openingHoursSpecification: (Object.keys(DAY_NAMES).map(Number) as DayIndex[]).flatMap((day) =>
      hours.weekly[day].map((range) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAYS[day],
        opens: range.open,
        closes: range.close,
      }))
    ),
    // Exceptional closures: opens and closes at "00:00" means closed (schema.org convention)
    specialOpeningHoursSpecification: hours.closures.map((closure) => ({
      "@type": "OpeningHoursSpecification",
      validFrom: closure.startDate,
      validThrough: closure.endDate,
      opens: "00:00",
      closes: "00:00",
    })),
  };
}

/** The website, published by the store. */
export function websiteJsonLd(siteUrl: string): JsonLd {
  return {
    "@type": "WebSite",
    "@id": websiteId(siteUrl),
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: "fr-FR",
    publisher: { "@id": storeId(siteUrl) },
  };
}

/** Breadcrumb trail, home first. `path` is site-relative ("/actualites"). */
export function breadcrumbJsonLd(items: { name: string; path: string }[], siteUrl: string): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(siteUrl, item.path),
    })),
  };
}

/** FAQ shown on the page (answers as plain text). */
export function faqJsonLd(items: { question: string; answer: string }[]): JsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface NewsPostFacts {
  headline: string;
  body: string;
  path: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string | null;
}

/** One news post. */
export function newsPostJsonLd(post: NewsPostFacts, siteUrl: string): JsonLd {
  const url = absolute(siteUrl, post.path);
  return {
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    mainEntityOfPage: url,
    url,
    headline: post.headline,
    articleBody: post.body,
    image: post.imageUrls.length > 0 ? post.imageUrls.map((u) => absolute(siteUrl, u)) : [absolute(siteUrl, DEFAULT_SHARE_IMAGE.url)],
    datePublished: post.createdAt,
    dateModified: post.updatedAt ?? post.createdAt,
    inLanguage: "fr-FR",
    author: { "@id": storeId(siteUrl) },
    publisher: { "@id": storeId(siteUrl) },
  };
}

/** Wraps several nodes in one document: `{ "@context", "@graph": [...] }`. */
export function jsonLdGraph(nodes: JsonLd[]): JsonLd {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** Serializes for a `<script type="application/ld+json">`: escapes "<" so the content can never close the tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
