"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface GalleryImage {
  url: string;
  width: number;
  height: number;
  /** Description typed by the admin; a generic text built from `label` is used when missing. */
  alt?: string;
}

interface NewsImageGalleryProps {
  images: GalleryImage[];
  /** Describes the post, e.g. "Actualité du 12 octobre 2026"; each photo's alt adds its position. */
  label: string;
  className?: string;
}

/** Single photos keep their own shape, within these bounds (portrait 4:5 to landscape 16:9). */
const SINGLE_MIN_RATIO = 4 / 5;
const SINGLE_MAX_RATIO = 16 / 9;

/** Social-media grids: 2 side by side, 3 as one tall + two stacked, 4 as a 2×2 square. */
const MULTI_LAYOUTS: Record<number, { grid: string; firstCell?: string }> = {
  2: { grid: "aspect-[2/1] grid-cols-2" },
  3: { grid: "aspect-[3/2] grid-cols-2 grid-rows-2", firstCell: "row-span-2" },
  4: { grid: "aspect-square grid-cols-2 grid-rows-2" },
};

/** Local previews in the editor (blob: URLs) cannot go through the image optimizer. */
const isLocalPreview = (url: string) => url.startsWith("blob:");

/** Width of the news column (max-w-2xl): grid cells never get wider. */
const COLUMN_SIZES = "(min-width: 672px) 672px, 100vw";
const HALF_COLUMN_SIZES = "(min-width: 672px) 336px, 50vw";

/**
 * Photos of a news post in a social-media grid. Tapping one opens it full size, with previous/next
 * buttons and arrow keys when the post has several. Stored photos go through the image optimizer
 * (a size per screen); local previews are shown as they are.
 */
export function NewsImageGallery({ images, label, className }: NewsImageGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const count = images.length;
  if (count === 0) return null;

  const altFor = (index: number) =>
    images[index].alt || (count > 1 ? `${label} — photo ${index + 1} sur ${count}` : label);
  const step = (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + count) % count));
  const handleKeyDown = (e: KeyboardEvent) => {
    if (count < 2) return;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  };

  const single = images[0];
  const singleRatio = Math.min(SINGLE_MAX_RATIO, Math.max(SINGLE_MIN_RATIO, single.width / single.height || 1));
  const layout = MULTI_LAYOUTS[Math.min(count, 4)];
  const current = openIndex === null ? null : images[openIndex];

  return (
    <>
      <div
        className={cn("grid gap-1 bg-surface-hover", count === 1 ? "grid-cols-1" : layout.grid, className)}
        style={count === 1 ? { aspectRatio: singleRatio } : undefined}
      >
        {images.slice(0, 4).map((image, index) => (
          <button
            key={image.url}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`Agrandir : ${altFor(index)}`}
            className={cn(
              "group relative min-h-0 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
              index === 0 && layout?.firstCell
            )}
          >
            <Image
              src={image.url}
              alt={altFor(index)}
              fill
              unoptimized={isLocalPreview(image.url)}
              sizes={count === 1 || (count === 3 && index === 0) ? COLUMN_SIZES : HALF_COLUMN_SIZES}
              className="object-cover transition-opacity duration-200 group-hover:opacity-95"
            />
          </button>
        ))}
      </div>

      <Dialog open={current !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent
          onKeyDown={handleKeyDown}
          className="gap-0 border-0 bg-scrim p-0 sm:max-w-5xl"
        >
          {current && openIndex !== null && (
            <>
              <DialogTitle className="sr-only">{altFor(openIndex)}</DialogTitle>
              <div className="relative flex items-center justify-center">
                <Image
                  src={current.url}
                  alt={altFor(openIndex)}
                  width={current.width}
                  height={current.height}
                  unoptimized={isLocalPreview(current.url)}
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="h-auto max-h-[80svh] w-auto max-w-full object-contain"
                />
                {count > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => step(-1)}
                      aria-label="Photo précédente"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full"
                    >
                      <ChevronLeft aria-hidden />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => step(1)}
                      aria-label="Photo suivante"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                    >
                      <ChevronRight aria-hidden />
                    </Button>
                  </>
                )}
              </div>
              {count > 1 && (
                <p className="py-3 text-center text-sm font-medium text-on-color" aria-live="polite">
                  {openIndex + 1} / {count}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
