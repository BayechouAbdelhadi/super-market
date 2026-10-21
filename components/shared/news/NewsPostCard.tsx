import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";
import { formatNewsDate, formatNewsFullDate } from "@/lib/news/format";
import { NewsImageGallery, type GalleryImage } from "./NewsImageGallery";

export interface NewsPostCardProps {
  body: string;
  images: GalleryImage[];
  createdAt: string;
  /** Set when the post was edited: adds "Modifiée" next to the date. */
  updatedAt?: string | null;
  /** Shown as the author, next to the store logo. */
  storeName: string;
  /** Reference time for "il y a …" (passed in so server and browser render the same text). */
  now: Date;
  /** The post's own page: the date links to it, social media style. */
  href?: string;
  /** Cuts the text after this many lines (home page teaser). */
  maxLines?: number;
  /** Top-right slot, e.g. a status badge in the admin list. */
  headerAside?: ReactNode;
  /** Bottom slot, e.g. "Voir plus" or the admin actions. */
  footer?: ReactNode;
  className?: string;
}

/**
 * One news post, social media style: store avatar, name and date, the text, then the photo grid edge to edge.
 * Shared by the home page, the news feed and the admin screen (list and live preview).
 */
export function NewsPostCard({
  body,
  images,
  createdAt,
  updatedAt,
  storeName,
  now,
  href,
  maxLines,
  headerAside,
  footer,
  className,
}: NewsPostCardProps) {
  const shortDate = formatNewsDate(createdAt, now);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <header className="flex items-center gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface p-0.5">
          <Image src="/logo-hq.png" alt="" width={44} height={44} className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text">{storeName}</p>
          <p className="text-sm text-text-muted">
            {href ? (
              <Link href={href} className="underline-offset-4 hover:text-text hover:underline">
                <time dateTime={createdAt} title={formatNewsFullDate(createdAt)}>
                  {shortDate}
                </time>
              </Link>
            ) : (
              <time dateTime={createdAt} title={formatNewsFullDate(createdAt)}>
                {shortDate}
              </time>
            )}
            {updatedAt && (
              <>
                {" · "}
                <time dateTime={updatedAt} title={`Modifiée le ${formatNewsFullDate(updatedAt).toLowerCase()}`}>
                  Modifiée
                </time>
              </>
            )}
          </p>
        </div>
        {headerAside}
      </header>

      {body && (
        <p
          className="px-4 pt-4 text-base leading-relaxed whitespace-pre-line break-words text-text sm:px-6"
          style={
            maxLines
              ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: maxLines, overflow: "hidden" }
              : undefined
          }
        >
          {body}
        </p>
      )}

      {images.length > 0 ? (
        <NewsImageGallery images={images} label={`Actualité de ${storeName}, ${shortDate.toLowerCase()}`} className="mt-4" />
      ) : (
        <div className="pb-4 sm:pb-6" />
      )}

      {footer && <div className="border-t border-border px-4 py-3 sm:px-6">{footer}</div>}
    </Card>
  );
}
