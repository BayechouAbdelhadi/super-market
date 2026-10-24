"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toDateTimeLocal } from "@/components/arrivals/format";
import { ARRIVALS_CONFIG, ARRIVAL_PRODUCTS } from "@/lib/arrivals/config";
import type { Arrival } from "@/lib/arrivals/types";

interface ItemState {
  /** Product of the category; also identifies the row. */
  name: string;
  included: boolean;
  id?: string;
  weightGrams: string;
  unitPrice: string;
  stockTotal: string;
  maxPerCustomer: string;
  /** Already reserved: the stock cannot go below it and the product cannot be removed. */
  stockReserved: number;
}

interface ArrivalFormProps {
  /** Arrival being edited; absent to create one. */
  arrival?: Arrival;
  onSaved: (arrival: Arrival) => void;
  onCancel?: () => void;
}

const textareaClass =
  "w-full min-h-[44px] rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition-all hover:border-[var(--color-border-hover)] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]";

/** One row per product of the category, filled from the arrival's items when editing. */
function initialItems(arrival?: Arrival): ItemState[] {
  return ARRIVAL_PRODUCTS[arrival?.category ?? ARRIVALS_CONFIG.defaultCategory].map((name) => {
    const existing = arrival?.items.find((i) => i.name === name);
    return {
      name,
      included: Boolean(existing),
      id: existing?.id,
      weightGrams: existing?.weightGrams ? String(existing.weightGrams) : "",
      unitPrice: existing ? String(existing.unitPrice) : "",
      stockTotal: existing ? String(existing.stockTotal) : "",
      maxPerCustomer: existing?.maxPerCustomer ? String(existing.maxPerCustomer) : "",
      stockReserved: existing?.stockReserved ?? 0,
    };
  });
}

/** Parses a French-typed decimal ("12,50"). */
const toNumber = (value: string) => Number(value.replace(",", "."));

/** Create or edit an arrival: dates, pickup day and the category's products to include (tray weight, price, stock, limit per customer). */
export function ArrivalForm({ arrival, onSaved, onCancel }: ArrivalFormProps) {
  const [title, setTitle] = useState(arrival?.title ?? "");
  const [description, setDescription] = useState(arrival?.description ?? "");
  const [opensAt, setOpensAt] = useState(arrival ? toDateTimeLocal(arrival.reservationOpensAt) : "");
  const [closesAt, setClosesAt] = useState(arrival ? toDateTimeLocal(arrival.reservationClosesAt) : "");
  const [pickupDate, setPickupDate] = useState(arrival?.pickupDate ?? "");
  const [items, setItems] = useState<ItemState[]>(() => initialItems(arrival));
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (name: string, changes: Partial<ItemState>) =>
    setItems((current) => current.map((i) => (i.name === name ? { ...i, ...changes } : i)));
  const includedCount = items.filter((i) => i.included).length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!opensAt || !closesAt) return;
    if (includedCount === 0) {
      toast.error("Incluez au moins un article.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        title,
        description: description.trim() || null,
        // datetime-local is in the admin's time zone (the store's)
        reservationOpensAt: new Date(opensAt).toISOString(),
        reservationClosesAt: new Date(closesAt).toISOString(),
        pickupDate,
        items: items
          .filter((i) => i.included)
          .map((i) => ({
            ...(i.id ? { id: i.id } : {}),
            name: i.name,
            weightGrams: toNumber(i.weightGrams),
            unitPrice: toNumber(i.unitPrice),
            stockTotal: toNumber(i.stockTotal),
            maxPerCustomer: i.maxPerCustomer.trim() ? toNumber(i.maxPerCustomer) : null,
          })),
      };
      const res = await fetch(arrival ? `/api/admin/arrivals/${arrival.id}` : "/api/admin/arrivals", {
        method: arrival ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      onSaved(data.arrival as Arrival);
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Erreur lors de l'enregistrement de l'arrivage.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="arrival-title"
        label="Titre"
        required
        maxLength={ARRIVALS_CONFIG.titleMaxLength}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex. : Arrivage de poulets fermiers"
      />

      <div className="space-y-2">
        <label htmlFor="arrival-description" className="block text-sm font-semibold text-[var(--color-text)]">
          Description <span className="font-normal text-[var(--color-text-muted)]">(facultatif)</span>
        </label>
        <textarea
          id="arrival-description"
          rows={2}
          maxLength={ARRIVALS_CONFIG.descriptionMaxLength}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={textareaClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          id="arrival-opens"
          type="datetime-local"
          label="Ouverture des réservations"
          required
          value={opensAt}
          onChange={(e) => setOpensAt(e.target.value)}
        />
        <Input
          id="arrival-closes"
          type="datetime-local"
          label="Clôture des réservations"
          required
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
        />
        <Input
          id="arrival-pickup"
          type="date"
          label="Jour de l'arrivage (retrait)"
          required
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
        />
      </div>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-[var(--color-text)]">Articles</legend>
        {items.map((item) => {
          const prefix = `item-${item.name.replace(/\s+/g, "-").toLowerCase()}`;
          return (
            <div
              key={item.name}
              className="space-y-4 rounded-[var(--radius-button,12px)] border border-[var(--color-border)] p-4"
            >
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={(e) => updateItem(item.name, { included: e.target.checked })}
                  disabled={item.stockReserved > 0}
                  className="h-5 w-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span className="text-sm font-semibold text-[var(--color-text)]">{item.name}</span>
                {item.stockReserved > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {item.stockReserved} déjà réservé(s) : ne peut pas être retiré
                  </span>
                )}
              </label>
              {item.included && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    id={`${prefix}-weight`}
                    label={`Poids d'une ${ARRIVALS_CONFIG.unitLabel} (g)`}
                    required
                    type="number"
                    min={ARRIVALS_CONFIG.minWeightGrams}
                    max={ARRIVALS_CONFIG.maxWeightGrams}
                    value={item.weightGrams}
                    onChange={(e) => updateItem(item.name, { weightGrams: e.target.value })}
                    placeholder="500"
                  />
                  <Input
                    id={`${prefix}-price`}
                    label={`Prix d'une ${ARRIVALS_CONFIG.unitLabel} (€)`}
                    required
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.name, { unitPrice: e.target.value })}
                    placeholder="12,50"
                  />
                  <Input
                    id={`${prefix}-stock`}
                    label="Stock"
                    required
                    type="number"
                    min={item.stockReserved}
                    max={ARRIVALS_CONFIG.maxStock}
                    value={item.stockTotal}
                    onChange={(e) => updateItem(item.name, { stockTotal: e.target.value })}
                  />
                  <Input
                    id={`${prefix}-max`}
                    label="Max. par client"
                    type="number"
                    min={1}
                    value={item.maxPerCustomer}
                    onChange={(e) => updateItem(item.name, { maxPerCustomer: e.target.value })}
                    placeholder="Illimité"
                  />
                </div>
              )}
            </div>
          );
        })}
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {arrival ? "Enregistrer les modifications" : "Créer l'arrivage"}
        </Button>
      </div>
    </form>
  );
}
