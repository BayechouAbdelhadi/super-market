import Image from "next/image";
import { arrivalProductImage } from "@/lib/arrivals/config";
import type { ArrivalCategory } from "@/lib/arrivals/types";

const SIZES = { sm: "size-12", md: "size-16" } as const;

/** Square photo of an arrival product, from the static images in lib/arrivals/config.ts. */
export function ProductThumbnail({
  category,
  name,
  size = "sm",
}: {
  category: ArrivalCategory;
  name: string;
  size?: keyof typeof SIZES;
}) {
  const image = arrivalProductImage(category, name);
  return (
    <span className={`relative shrink-0 overflow-hidden rounded-[var(--radius-button)] bg-surface-hover ${SIZES[size]}`}>
      <Image src={image.src} alt={image.alt} fill sizes="64px" className="object-cover" />
    </span>
  );
}
