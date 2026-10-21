import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Newspaper } from "lucide-react";
import { cn } from "cn";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { NewsPostCard } from "@/components/shared/news/NewsPostCard";
import { FacebookButton } from "@/components/public/FacebookButton";
import { getAppSettings } from "@/lib/settings/service";
import { NEWS_CONFIG } from "@/lib/news/config";
import { listPublishedNews } from "@/lib/news/service";
import type { NewsPostPage } from "@/lib/news/types";
import { NewsFeedPageSchema } from "@/lib/news/validation";

// New posts show up immediately, and "il y a …" depends on the request time
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Nos actualités — Super Market Calais" },
  description: "Arrivages, nouveautés, promotions et événements de Super Market Calais, votre supermarché de quartier.",
  alternates: { canonical: "/actualites" },
  openGraph: {
    title: "Nos actualités — Super Market Calais",
    description: "Suivez la vie de votre supermarché de quartier à Calais.",
    type: "website",
    locale: "fr_FR",
  },
};

interface NewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

/** Public news feed: published posts, newest first, one column like a social media timeline. */
export default async function NewsPage({ searchParams }: NewsPageProps) {
  const page = NewsFeedPageSchema.parse((await searchParams).page);
  const pageSize = NEWS_CONFIG.publicPageSize;
  const { store } = await getAppSettings();
  const now = new Date();

  let feed: NewsPostPage = { items: [], total: 0 };
  let loadFailed = false;
  try {
    feed = await listPublishedNews((page - 1) * pageSize, pageSize);
  } catch (err) {
    console.error("[NewsPage] Failed to load posts:", err);
    loadFailed = true;
  }
  const totalPages = Math.max(1, Math.ceil(feed.total / pageSize));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold text-primary-ink">Nos actualités</p>
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Quoi de neuf au magasin ?</h1>
        <p className="text-base leading-relaxed text-text-muted">
          Arrivages, nouveautés et événements : suivez la vie de votre supermarché.
        </p>
        <div className="pt-4">
          <FacebookButton className="w-full sm:w-auto" />
        </div>
      </div>

      {loadFailed ? (
        <Alert variant="danger">Impossible de charger les actualités pour le moment. Réessayez dans quelques instants.</Alert>
      ) : feed.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border px-6 py-16 text-center">
          <Newspaper aria-hidden className="size-8 text-text-muted" />
          <p className="text-base font-semibold text-text">
            {page > 1 ? "Aucune actualité sur cette page." : "Aucune actualité pour le moment."}
          </p>
          <p className="text-sm text-text-muted">Revenez bientôt : nos nouveautés seront publiées ici.</p>
        </div>
      ) : (
        <ol className="space-y-6">
          {feed.items.map((post) => (
            <li key={post.id}>
              <article>
                <NewsPostCard
                  body={post.body}
                  images={post.images}
                  createdAt={post.createdAt}
                  updatedAt={post.updatedAt}
                  storeName={store.storeName}
                  now={now}
                />
              </article>
            </li>
          ))}
        </ol>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pages des actualités" className="flex items-center justify-between gap-3">
          <Link
            href={page - 1 <= 1 ? "/actualites" : `/actualites?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={cn(buttonVariants({ variant: "secondary" }), page <= 1 && "pointer-events-none opacity-50")}
          >
            <ArrowLeft aria-hidden />
            Plus récentes
          </Link>
          <span className="text-sm text-text-muted">
            Page {Math.min(page, totalPages)} / {totalPages}
          </span>
          <Link
            href={`/actualites?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={cn(buttonVariants({ variant: "secondary" }), page >= totalPages && "pointer-events-none opacity-50")}
          >
            Plus anciennes
            <ArrowRight aria-hidden />
          </Link>
        </nav>
      )}
    </main>
  );
}
