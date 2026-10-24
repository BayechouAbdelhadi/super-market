"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ARRIVALS_CONFIG } from "@/lib/arrivals/config";
import { maxReservable, remainingStock, reservationTotal } from "@/lib/arrivals/domain";
import type { Arrival } from "@/lib/arrivals/types";
import { formatDay, formatEuro } from "./format";
import { ProductThumbnail } from "./ProductThumbnail";

interface ReservationFormProps {
  arrival: Arrival;
  /** False before opening and after closing: quantities stay visible but locked. */
  canReserve: boolean;
}

/** Quantity per product, live total, then a confirmation showing what will be paid at pickup. */
export function ReservationForm({ arrival, canReserve }: ReservationFormProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  const lines = arrival.items
    .filter((item) => (quantities[item.id] ?? 0) > 0)
    .map((item) => ({
      itemId: item.id,
      itemName: item.name,
      unitLabel: item.unitLabel,
      unitPrice: item.unitPrice,
      quantity: quantities[item.id],
    }));
  const total = reservationTotal(lines);

  const setQuantity = (itemId: string, value: number, max: number) =>
    setQuantities((current) => ({ ...current, [itemId]: Math.max(0, Math.min(max, value)) }));

  const handleSubmit = async () => {
    if (lines.length === 0) return;
    const confirmed = await confirm({
      title: "Confirmer la réservation ?",
      description: `${lines.map((l) => `${l.quantity} × ${l.itemName}`).join(", ")}. Total : ${formatEuro(
        total
      )}, à régler en magasin au retrait le ${formatDay(arrival.pickupDate)}.`,
      confirmLabel: "Réserver",
      tone: "default",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/arrivals/${arrival.id}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map(({ itemId, quantity }) => ({ itemId, quantity })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Erreur lors de la réservation. Veuillez réessayer.");
        // Someone else may have taken the stock: show the current quantities
        if (res.status === 409) router.refresh();
        return;
      }
      toast.success(data.message || "Réservation confirmée.");
      router.push("/account/reservations");
    } catch {
      toast.error("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padded="lg" className="gap-6">
      <h2 className="text-lg font-bold text-text">Votre réservation</h2>

      <ul className="divide-y divide-border">
        {arrival.items.map((item) => {
          const max = maxReservable(item, ARRIVALS_CONFIG.maxQuantityPerLine);
          const quantity = quantities[item.id] ?? 0;
          const left = remainingStock(item);
          const disabled = !canReserve || max === 0;
          return (
            <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumbnail category={arrival.category} name={item.name} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-text">{item.name}</p>
                  <p className="text-sm text-text-muted">
                    {formatEuro(item.unitPrice)} / {item.unitLabel} ·{" "}
                    {left > 0 ? `${left} disponible(s)` : "Épuisé"}
                    {item.maxPerCustomer !== null && ` · ${item.maxPerCustomer} max. par client`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2" role="group" aria-label={`Quantité : ${item.name}`}>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setQuantity(item.id, quantity - 1, max)}
                  disabled={disabled || quantity === 0}
                  aria-label={`Retirer une ${item.unitLabel}`}
                >
                  <Minus aria-hidden />
                </Button>
                <span className="w-10 text-center text-lg font-bold tabular-nums text-text" aria-live="polite">
                  {quantity}
                </span>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setQuantity(item.id, quantity + 1, max)}
                  disabled={disabled || quantity >= max}
                  aria-label={`Ajouter une ${item.unitLabel}`}
                >
                  <Plus aria-hidden />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-sm font-semibold text-text">Total à régler au retrait</span>
        <span className="text-2xl font-bold tabular-nums text-text">{formatEuro(total)}</span>
      </div>

      <Button size="lg" onClick={handleSubmit} loading={submitting} disabled={!canReserve || lines.length === 0}>
        Réserver
      </Button>
      {confirmDialog}
    </Card>
  );
}
