import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/seo/config";

// No robots tag here: Next already marks 404 responses noindex
export const metadata: Metadata = { title: "Page introuvable" };

/**
 * 404 for any unknown URL (Next answers with the 404 status). Rendered in the root layout, outside the site
 * shell, so it holds its own scroll container (§ 25.1).
 */
export default function NotFound() {
  return (
    <main className="flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-background px-4 py-12 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <Link href="/" aria-label={`${SITE_NAME} — accueil`} className="rounded-full">
          <Image src="/logo-hq.png" alt="" width={96} height={96} priority className="size-24" />
        </Link>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-primary-ink">Erreur 404</p>
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Page introuvable</h1>
          <p className="text-base leading-relaxed text-text-muted">
            Cette page n&apos;existe pas ou a été déplacée. Nos rayons, nos horaires et nos actualités vous attendent
            sur la page d&apos;accueil.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/" className={buttonVariants({ variant: "primary", size: "lg" })}>
            <Home aria-hidden />
            Retour à l&apos;accueil
          </Link>
          <Link href="/actualites" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Nos actualités
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
