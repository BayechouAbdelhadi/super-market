import Image from "next/image";
import Link from "next/link";
import { CalendarClock, ShoppingBasket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ARRIVAL_CATEGORY_IMAGES, ARRIVAL_CATEGORY_LABELS, ARRIVAL_PHASE_LABELS } from "@/lib/arrivals/config";
import { getArrivalPhase, remainingStock } from "@/lib/arrivals/domain";
import type { Arrival } from "@/lib/arrivals/types";
import { formatDateTime, formatDay, formatEuro } from "./format";
import { ProductThumbnail } from "./ProductThumbnail";

export function arrivalPath(id: string): string {
  return `/arrivages/${id}`;
}

/** Arrival on the home page: products, prices, dates and the reserve button (locked until opening). */
export function ArrivalCard({ arrival, now }: { arrival: Arrival; now: Date }) {
  const phase = getArrivalPhase(arrival, now);
  const isOpen = phase === "OPEN";
  const soldOut = arrival.items.every((item) => remainingStock(item) === 0);
  const cover = ARRIVAL_CATEGORY_IMAGES[arrival.category];

  return (
    <Card padded="md" className="h-full gap-5">
      <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-button)] bg-surface-hover">
        <Image
          src={cover.src}
          alt={cover.alt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 90vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral" size="md">
          {ARRIVAL_CATEGORY_LABELS[arrival.category]}
        </Badge>
        <Badge variant={isOpen ? (soldOut ? "danger" : "success") : "warning"} size="md">
          {isOpen && soldOut ? "Épuisé" : ARRIVAL_PHASE_LABELS[phase]}
        </Badge>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-text">{arrival.title}</h3>
        {arrival.description && <p className="text-sm leading-relaxed text-text-muted">{arrival.description}</p>}
      </div>

      <ul className="divide-y divide-border">
        {arrival.items.map((item) => {
          const left = remainingStock(item);
          return (
            <li key={item.id} className="flex items-center gap-3 py-2 text-sm">
              <ProductThumbnail category={arrival.category} name={item.name} />
              <span className="min-w-0 flex-1 text-text">
                {item.name} <span className="block text-xs text-text-muted">{item.unitLabel}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="font-semibold tabular-nums text-text">{formatEuro(item.unitPrice)}</span>
                <span className="block text-xs text-text-muted">{left > 0 ? `${left} disponible(s)` : "Épuisé"}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-text-muted" />
          <div>
            <dt className="sr-only">Réservations</dt>
            <dd className="text-text">
              {phase === "SCHEDULED"
                ? `Réservations à partir du ${formatDateTime(arrival.reservationOpensAt)}`
                : `Réservations jusqu'au ${formatDateTime(arrival.reservationClosesAt)}`}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ShoppingBasket aria-hidden className="mt-0.5 size-4 shrink-0 text-text-muted" />
          <div>
            <dt className="sr-only">Retrait</dt>
            <dd className="text-text">Retrait en magasin le {formatDay(arrival.pickupDate)}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-auto">
        {isOpen && !soldOut ? (
          <Link href={arrivalPath(arrival.id)} className={buttonVariants({ variant: "primary", className: "w-full" })}>
            Réserver
          </Link>
        ) : (
          <Button variant="secondary" disabled className="w-full">
            {isOpen ? "Épuisé" : `Ouverture le ${formatDateTime(arrival.reservationOpensAt)}`}
          </Button>
        )}
      </div>
    </Card>
  );
}
