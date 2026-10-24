"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { RESERVATION_ACTION_LABELS } from "@/lib/arrivals/config";
import { canTransition } from "@/lib/arrivals/domain";
import type { Reservation, StaffReservationStatus } from "@/lib/arrivals/types";
import { formatEuro } from "./format";

interface ReservationActionsProps {
  reservation: Reservation;
  onChanged: (updated: Reservation) => void;
  /** Smaller buttons for list rows. */
  compact?: boolean;
}

/** Staff status buttons (collected, reminded, missed, cancelled), shared by the checkout and the admin arrival page. */
export function ReservationActions({ reservation, onChanged, compact = false }: ReservationActionsProps) {
  const [busy, setBusy] = useState<StaffReservationStatus | null>(null);
  const [confirm, confirmDialog] = useConfirm();
  const size = compact ? "sm" : "default";

  const apply = async (status: StaffReservationStatus) => {
    if (status !== "REMINDED") {
      const confirmed = await confirm(
        status === "COLLECTED"
          ? {
              title: "Réservation récupérée ?",
              description: `${reservation.customer.fullName} repart avec sa commande (${formatEuro(reservation.totalAmount)}).`,
              confirmLabel: "Marquer récupérée",
              tone: "default",
            }
          : status === "NO_SHOW"
            ? {
                title: "Marquer non récupérée ?",
                description: "Le client n'est pas venu chercher sa commande. Le statut ne pourra plus être changé.",
                confirmLabel: "Non récupérée",
              }
            : {
                title: "Annuler la réservation ?",
                description: "Les articles seront remis en vente. Cette action est définitive.",
                confirmLabel: "Annuler la réservation",
                cancelLabel: "Garder",
              }
      );
      if (!confirmed) return;
    }

    setBusy(status);
    try {
      const res = await fetch(`/api/loyalty/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      onChanged(data.reservation as Reservation);
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur lors du changement de statut.");
    } finally {
      setBusy(null);
    }
  };

  if (!canTransition(reservation.status, "COLLECTED")) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button size={size} onClick={() => apply("COLLECTED")} loading={busy === "COLLECTED"} disabled={busy !== null}>
        {RESERVATION_ACTION_LABELS.COLLECTED}
      </Button>
      {canTransition(reservation.status, "REMINDED") && (
        <Button
          size={size}
          variant="secondary"
          onClick={() => apply("REMINDED")}
          loading={busy === "REMINDED"}
          disabled={busy !== null}
        >
          {RESERVATION_ACTION_LABELS.REMINDED}
        </Button>
      )}
      <Button
        size={size}
        variant="ghost"
        onClick={() => apply("NO_SHOW")}
        loading={busy === "NO_SHOW"}
        disabled={busy !== null}
      >
        {RESERVATION_ACTION_LABELS.NO_SHOW}
      </Button>
      <Button
        size={size}
        variant="ghost"
        onClick={() => apply("CANCELLED")}
        loading={busy === "CANCELLED"}
        disabled={busy !== null}
        className="hover:bg-danger-subtle hover:text-danger-text"
      >
        {RESERVATION_ACTION_LABELS.CANCELLED}
      </Button>
      {confirmDialog}
    </div>
  );
}
