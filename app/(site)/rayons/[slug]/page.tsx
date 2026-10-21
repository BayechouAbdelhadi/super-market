import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, MapPin, Navigation, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/public/Breadcrumb";
import { DepartmentCard } from "@/components/public/DepartmentCard";
import { FaqSection } from "@/components/public/home/FaqSection";
import { SectionHeading } from "@/components/public/home/SectionHeading";
import { JsonLd } from "@/components/shared/JsonLd";
import { getAppSettings } from "@/lib/settings/service";
import { BASE_OPEN_GRAPH } from "@/lib/seo/config";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/structured-data";
import { formatPhone, phoneHref } from "@/lib/store/contact";
import { STORE_ACCESS, STORE_LOCATION } from "@/lib/store/config";
import { DEPARTMENTS, departmentPath, findDepartment } from "@/lib/store/departments";
import { isOpenEveryDay } from "@/lib/store/opening-hours";
import { getSiteUrl } from "@/lib/utils/app-url";

// Address, phone and hours come from the admin settings
export const dynamic = "force-dynamic";

interface DepartmentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DepartmentPageProps): Promise<Metadata> {
  const department = findDepartment((await params).slug);
  if (!department) return {};
  const path = departmentPath(department.slug);
  return {
    title: department.heading,
    description: department.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      title: department.heading,
      description: department.metaDescription,
      url: path,
      images: [{ url: department.image.src, alt: department.image.alt }],
    },
  };
}

/**
 * One store department, built to answer a local search ("poulet halal Calais"…): what the department offers,
 * how to get there, questions and the other departments.
 */
export default async function DepartmentPage({ params }: DepartmentPageProps) {
  const department = findDepartment((await params).slug);
  if (!department) notFound();

  const { store, hours } = await getAppSettings();
  const siteUrl = getSiteUrl();
  const path = departmentPath(department.slug);
  const trail = [
    { name: "Accueil", path: "/" },
    { name: "Nos rayons", path: "/#rayons" },
    { name: department.title, path },
  ];
  const others = DEPARTMENTS.filter((other) => other.slug !== department.slug);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-16 px-4 pt-6 pb-16 sm:space-y-24 sm:px-6 sm:pt-8">
      <JsonLd nodes={[breadcrumbJsonLd(trail, siteUrl), faqJsonLd(department.faq)]} />

      <div className="space-y-6">
        <Breadcrumb items={trail} />
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="space-y-5">
            <p className="text-sm font-semibold text-primary-ink">{department.badge}</p>
            <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl md:text-5xl md:leading-[1.1]">
              {department.heading}
            </h1>
            <ul className="flex flex-wrap gap-2">
              {department.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-text"
                >
                  {highlight}
                </li>
              ))}
            </ul>
            {department.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base leading-relaxed text-text-muted sm:text-lg">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-surface-hover">
            <Image
              src={department.image.src}
              alt={department.image.alt}
              fill
              preload
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card padded="lg" className="gap-4">
          <h2 className="text-xl font-bold tracking-tight text-text">Ce que vous trouverez</h2>
          <ul className="space-y-3">
            {department.products.map((product) => (
              <li key={product} className="flex items-start gap-3 text-base text-text">
                <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-success-text" />
                {product}
              </li>
            ))}
          </ul>
        </Card>

        <Card padded="lg" className="gap-4">
          <h2 className="text-xl font-bold tracking-tight text-text">Venir au magasin</h2>
          <ul className="space-y-3 text-base text-text">
            <li className="flex items-start gap-3">
              <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-text-muted" />
              <span>
                {store.address}
                <span className="block text-sm text-text-muted">{STORE_ACCESS.parking}</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-text-muted" />
              <Link href="/#infos" className="underline-offset-4 hover:underline">
                {isOpenEveryDay(hours.weekly) ? "Ouvert 7 jours sur 7 — voir les horaires" : "Voir les horaires"}
              </Link>
            </li>
          </ul>
          <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row">
            <a
              href={STORE_LOCATION.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "primary" })}
            >
              <Navigation aria-hidden />
              Itinéraire
            </a>
            {store.phone && (
              <a href={phoneHref(store.phone)} className={buttonVariants({ variant: "secondary" })}>
                <Phone aria-hidden />
                {formatPhone(store.phone)}
              </a>
            )}
          </div>
        </Card>
      </div>

      <FaqSection items={department.faq} id="questions" title={`${department.title} : vos questions`} />

      <section aria-labelledby="autres-rayons-title" className="space-y-8">
        <SectionHeading id="autres-rayons-title" eyebrow="Nos rayons" title="Découvrez aussi" />
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((other) => (
            <li key={other.slug}>
              <DepartmentCard
                title={other.title}
                description={other.summary}
                image={other.image}
                badge={other.badge}
                highlights={other.highlights}
                href={departmentPath(other.slug)}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
