import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumb } from "@/components/public/Breadcrumb";
import { FacebookButton } from "@/components/public/FacebookButton";
import { ShareButton } from "@/components/public/ShareButton";
import { NewsPostCard } from "@/components/shared/news/NewsPostCard";
import { JsonLd } from "@/components/shared/JsonLd";
import { getAppSettings } from "@/lib/settings/service";
import { getPublishedNewsPost } from "@/lib/news/service";
import { newsPostDescription, newsPostHeadline, newsPostPath, parseNewsPostParam } from "@/lib/news/permalink";
import type { NewsPost } from "@/lib/news/types";
import { BASE_OPEN_GRAPH } from "@/lib/seo/config";
import { breadcrumbJsonLd, newsPostJsonLd } from "@/lib/seo/structured-data";
import { getSiteUrl } from "@/lib/utils/app-url";

// Edits and hiding take effect immediately; "il y a …" depends on the request time
export const dynamic = "force-dynamic";

interface NewsPostPageProps {
  params: Promise<{ slug: string }>;
}

/** The published post for a "<slug>-<uuid>" segment, or null. Cached: metadata and page share one query. */
const loadPost = cache(async (param: string): Promise<NewsPost | null> => {
  const id = parseNewsPostParam(param);
  return id ? getPublishedNewsPost(id) : null;
});

export async function generateMetadata({ params }: NewsPostPageProps): Promise<Metadata> {
  const post = await loadPost((await params).slug);
  if (!post) return {};
  const headline = newsPostHeadline(post);
  const description = newsPostDescription(post);
  const path = newsPostPath(post);
  const photo = post.images[0];
  return {
    title: headline,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      type: "article",
      title: headline,
      description,
      url: path,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt ?? post.createdAt,
      ...(photo && { images: [{ url: photo.url, width: photo.width, height: photo.height, alt: headline }] }),
    },
    ...(photo && { twitter: { card: "summary_large_image", images: [photo.url] } }),
  };
}

/** One news post: its own URL to share, with its photo as the link preview. Hidden posts answer 404. */
export default async function NewsPostPage({ params }: NewsPostPageProps) {
  const param = (await params).slug;
  const post = await loadPost(param);
  if (!post) notFound();

  // The text (hence the slug) may have changed: keep a single address per post
  const path = newsPostPath(post);
  if (`/actualites/${param}` !== path) permanentRedirect(path);

  const { store } = await getAppSettings();
  const siteUrl = getSiteUrl();
  const headline = newsPostHeadline(post);
  const trail = [
    { name: "Accueil", path: "/" },
    { name: "Actualités", path: "/actualites" },
    { name: headline, path },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
      <JsonLd
        nodes={[
          breadcrumbJsonLd(trail, siteUrl),
          newsPostJsonLd(
            {
              headline,
              body: post.body,
              path,
              imageUrls: post.images.map((image) => image.url),
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
            },
            siteUrl
          ),
        ]}
      />
      <Breadcrumb items={trail} />
      <h1 className="sr-only">{headline}</h1>
      <article>
        <NewsPostCard
          body={post.body}
          images={post.images}
          createdAt={post.createdAt}
          updatedAt={post.updatedAt}
          storeName={store.storeName}
          now={new Date()}
        />
      </article>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ShareButton title={headline} url={`${siteUrl}${path}`} />
        <FacebookButton />
        <Link href="/actualites" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          <ArrowLeft aria-hidden />
          Toutes les actualités
        </Link>
      </div>
    </main>
  );
}
