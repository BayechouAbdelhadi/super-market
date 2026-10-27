"use client";

import { useEffect, useState } from "react";
import { ShoppingBasket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { isActiveReservation } from "@/lib/arrivals/domain";
import type { Reservation } from "@/lib/arrivals/types";
import { ReservationActions } from "./ReservationActions";
import { ReservationLines } from "./ReservationLines";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { ReservationTimeline } from "./ReservationTimeline";
import { formatDateTime, formatDay } from "./format";

/**
 * Customer's latest reservation waiting for pickup, on the checkout customer page
 * (cashier and admin). Hidden when there is none.
 */
export function CheckoutReservationPanel({ customerId }: { customerId: string }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/loyalty/customers/${customerId}/reservation`)
      .then((res) => (res.ok ? res.json() : { reservation: null }))
      .then((data) => {
        if (!cancelled) setReservation(data.reservation ?? null);
      })
      .catch((err) => console.error("Erreur chargement réservation :", err));
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (!reservation) return null;

  return (
    <Card padded="lg" className="gap-5 border-primary">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-hover text-text">
            <ShoppingBasket aria-hidden className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-primary-ink">Réservation</p>
            <h2 className="text-lg font-bold text-text">{reservation.arrival.title}</h2>
            <p className="text-sm text-text-muted">Retrait le {formatDay(reservation.arrival.pickupDate)}</p>
            {reservation.history.length < 2 && (
              <p className="text-xs text-text-muted">Réservée le {formatDateTime(reservation.createdAt)}</p>
            )}
          </div>
        </div>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      <ReservationTimeline history={reservation.history} orientation="horizontal" />

      <ReservationLines lines={reservation.lines} totalAmount={reservation.totalAmount} />

      {isActiveReservation(reservation.status) && (
        <ReservationActions reservation={reservation} onChanged={setReservation} />
      )}
    </Card>
  );
}
