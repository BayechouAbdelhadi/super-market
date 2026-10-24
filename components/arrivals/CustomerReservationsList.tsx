"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/Pagination";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ARRIVALS_CONFIG } from "@/lib/arrivals/config";
import { canCustomerCancel } from "@/lib/arrivals/domain";
import type { Reservation } from "@/lib/arrivals/types";
import { ReservationLines } from "./ReservationLines";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { formatDateTime, formatDay } from "./format";

interface CustomerReservationsListProps {
  initialReservations: Reservation[];
  initialTotal: number;
  loadFailed: boolean;
}

/** The customer's reservations, newest first; active ones can be cancelled while the arrival is open. */
export function CustomerReservationsList({ initialReservations, initialTotal, loadFailed }: CustomerReservationsListProps) {
  const pageSize = ARRIVALS_CONFIG.customerReservationsPageSize;
  const [reservations, setReservations] = useState(initialReservations);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const loadPage = async (target: number) => {
    try {
      const res = await fetch(`/api/account/reservations?page=${target}&limit=${pageSize}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
      setReservations(data.reservations);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Impossible de charger vos réservations.");
    }
  };

  const handleCancel = async (reservation: Reservation) => {
    const confirmed = await confirm({
      title: "Annuler cette réservation ?",
      description: "Les articles seront remis en vente. Vous pourrez réserver à nouveau tant qu'il reste du stock.",
      confirmLabel: "Annuler la réservation",
      cancelLabel: "Garder",
    });
    if (!confirmed) return;
    setBusyId(reservation.id);
    try {
      const res = await fetch(`/api/account/reservations/${reservation.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || "Réservation annulée.");
      await loadPage(page);
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur lors de l'annulation.");
    } finally {
      setBusyId(null);
    }
  };

  if (loadFailed) {
    return (
      <Card padded="lg" className="items-center gap-2 py-12 text-center">
        <p className="text-base font-semibold text-text">Impossible de charger vos réservations</p>
        <p className="text-sm text-text-muted">Réessayez dans quelques instants.</p>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card padded="lg" className="items-center gap-3 py-12 text-center">
        <CalendarCheck aria-hidden className="h-8 w-8 text-text-muted" />
        <p className="text-base font-semibold text-text">Aucune réservation pour le moment</p>
        <p className="text-sm text-text-muted">Les arrivages à réserver sont annoncés sur la page d&apos;accueil.</p>
        <Link href="/#arrivages" className={buttonVariants({ variant: "secondary" })}>
          Voir les arrivages
        </Link>
      </Card>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {reservations.map((reservation) => (
          <li key={reservation.id}>
            <Card padded="md" className="gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg font-bold text-text">{reservation.arrival.title}</h2>
                  <p className="flex items-center gap-2 text-sm text-text-muted">
                    <ShoppingBasket aria-hidden className="size-4 shrink-0" />
                    Retrait le {formatDay(reservation.arrival.pickupDate)}
                  </p>
                  <p className="text-xs text-text-muted">Réservée le {formatDateTime(reservation.createdAt)}</p>
                </div>
                <ReservationStatusBadge status={reservation.status} />
              </div>

              <ReservationLines lines={reservation.lines} totalAmount={reservation.totalAmount} />

              {canCustomerCancel(reservation.status, reservation.arrival, now) && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => handleCancel(reservation)}
                    loading={busyId === reservation.id}
                    className="hover:bg-danger-subtle hover:text-danger-text"
                  >
                    Annuler la réservation
                  </Button>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={loadPage}
      />
      {confirmDialog}
    </div>
  );
}
