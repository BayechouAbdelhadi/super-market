import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NewsPostCard } from "@/components/shared/news/NewsPostCard";
import { NEWS_CONFIG } from "@/lib/news/config";
import type { NewsPost } from "@/lib/news/types";
import { SectionHeading } from "./SectionHeading";

interface LatestNewsSectionProps {
  post: NewsPost;
  storeName: string;
  now: Date;
}

/** The latest store news on the home page, with a link to the full feed. */
export function LatestNewsSection({ post, storeName, now }: LatestNewsSectionProps) {
  return (
    <section id="actualites" aria-labelledby="actualites-title" className="scroll-mt-24 space-y-8">
      <SectionHeading
        id="actualites-title"
        eyebrow="Nos actualités"
        title="Quoi de neuf au magasin ?"
        description="Arrivages, nouveautés et événements : suivez la vie de votre supermarché."
      />
      <div className="max-w-2xl space-y-6">
        <NewsPostCard
          body={post.body}
          images={post.images}
          createdAt={post.createdAt}
          updatedAt={post.updatedAt}
          storeName={storeName}
          now={now}
          maxLines={NEWS_CONFIG.teaserMaxLines}
        />
        <Link href="/actualites" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          <span>Voir plus d&apos;actualités</span>
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
