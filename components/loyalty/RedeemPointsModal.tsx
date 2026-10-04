"use client";

import React, { useState } from "react";
import { CustomerDetail } from "@/lib/loyalty/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface RedeemPointsModalProps {
  isOpen: boolean;
  customer: CustomerDetail | null;
  onClose: () => void;
  onPointsRedeemed: (updatedCustomer: CustomerDetail) => void;
}

export function RedeemPointsModal({
  isOpen,
  customer,
  onClose,
  onPointsRedeemed,
}: RedeemPointsModalProps) {
  const [pointsStr, setPointsStr] = useState("");
  const [reason, setReason] = useState("Remise fidélité en caisse");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !customer) return null;

  const pointsToRedeem = parseInt(pointsStr, 10);
  const isValidInteger = Number.isInteger(pointsToRedeem) && pointsToRedeem > 0;
  const isExceedingBalance = isValidInteger && pointsToRedeem > customer.available_points;
  const remainingPoints = isValidInteger && !isExceedingBalance
    ? customer.available_points - pointsToRedeem
    : customer.available_points;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!isValidInteger) {
      setErrorMsg("Veuillez saisir un nombre entier de points strictement positif.");
      return;
    }

    if (isExceedingBalance) {
      setErrorMsg(
        `Impossible d'utiliser plus de points que le solde disponible (${customer?.available_points} max).`,
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/customers/${customer?.id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: pointsToRedeem,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Erreur lors de la déduction des points.");
        return;
      }

      onPointsRedeemed(data.customer);
      setPointsStr("");
      onClose();
    } catch {
      setErrorMsg("Erreur réseau ou serveur inaccessible.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setPointsStr("");
    setErrorMsg("");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Utiliser des points fidélité"
      icon="🎟️"
      description={`Client : ${customer.full_name}`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-[var(--radius-button,12px)] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Current Available Balance Card */}
        <div className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)] font-medium">
            Solde disponible actuel :
          </span>
          <span className="text-lg font-extrabold text-[var(--color-primary)]">
            {customer.available_points.toLocaleString("fr-FR")} pts
          </span>
        </div>

        {/* Points input */}
        <div className="space-y-1.5">
          <label
            htmlFor="points-to-redeem"
            className="block text-xs font-semibold text-[var(--color-text)] tracking-wide"
          >
            Points à déduire *
          </label>
          <input
            id="points-to-redeem"
            type="number"
            min={1}
            max={customer.available_points}
            step={1}
            required
            autoFocus
            value={pointsStr}
            onChange={(e) => setPointsStr(e.target.value)}
            placeholder="0"
            className="w-full h-14 text-2xl sm:text-3xl font-bold rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 px-4 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>

        {/* Balance projection or warning (§ 14) */}
        {isExceedingBalance ? (
          <div className="p-3 rounded-[var(--radius-button,12px)] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>
              Solde insuffisant ! Vous ne pouvez pas déduire plus de {customer.available_points} points.
            </span>
          </div>
        ) : isValidInteger ? (
          <div className="p-3 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Nouveau solde après déduction :</span>
            <strong className="text-sm font-bold text-[var(--color-text)]">
              {remainingPoints.toLocaleString("fr-FR")} pts
            </strong>
          </div>
        ) : null}

        {/* Quick point chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[var(--color-text-muted)] font-medium">Raccourcis :</span>
          {[50, 100, 250, 500].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={preset > customer.available_points}
              onClick={() => setPointsStr(preset.toString())}
              className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-mono text-[11px] disabled:opacity-40 transition-colors cursor-pointer"
            >
              -{preset} pts
            </button>
          ))}
        </div>

        {/* Reason input */}
        <Input
          label="Motif de l'opération"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Remise en caisse"
        />

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--color-border)]">
          <Button
            variant="secondary"
            type="button"
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            type="submit"
            disabled={loading || !isValidInteger || isExceedingBalance}
          >
            {loading ? "Déduction..." : `Déduire ${isValidInteger ? `${pointsToRedeem} pts` : "les points"}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
