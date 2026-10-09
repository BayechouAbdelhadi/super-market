"use client";

import React, { useState } from "react";
import { CustomerDetail } from "@/lib/loyalty/types";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

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
  // Both required inputs: purchase amount (€) and points to redeem
  const [amountStr, setAmountStr] = useState("");
  const [pointsStr, setPointsStr] = useState("");
  const [reason, setReason] = useState("Remise fidélité en caisse");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !customer) return null;

  // Amount parsing & validation (allows 0 € or any positive amount)
  const rawAmount = amountStr.trim().replace(",", ".");
  const parsedAmount = rawAmount === "" ? 0 : parseFloat(rawAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 0;

  // Points parsing & validation
  const pointsToRedeem = parseInt(pointsStr.trim(), 10);
  const isValidPoints = Number.isInteger(pointsToRedeem) && pointsToRedeem > 0;
  const isExceedingBalance = isValidPoints && pointsToRedeem > customer.available_points;
  const remainingPoints = isValidPoints && !isExceedingBalance
    ? customer.available_points - pointsToRedeem
    : customer.available_points;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!isValidAmount) {
      setErrorMsg("Veuillez saisir un montant d'achat valide (supérieur ou égal à 0 €).");
      return;
    }

    if (!isValidPoints) {
      setErrorMsg("Veuillez saisir le nombre de points fidélité à déduire (strictement supérieur à 0).");
      return;
    }

    if (isExceedingBalance) {
      setErrorMsg(
        `Impossible de déduire plus de points que le solde disponible (${customer?.available_points} max).`,
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/customers/${customer?.id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          points: pointsToRedeem,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Erreur lors de la validation de la déduction.");
        return;
      }

      onPointsRedeemed(data.customer);
      setAmountStr("");
      setPointsStr("");
      onClose();
    } catch {
      setErrorMsg("Erreur réseau ou serveur inaccessible.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setAmountStr("");
    setPointsStr("");
    setErrorMsg("");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Achat avec utilisation de points"
      icon="🎟️"
      description={`Client : ${customer.full_name} · Solde disponible : ${customer.available_points.toLocaleString("fr-FR")} pts`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-[var(--radius-button,12px)] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Current Balance Card */}
        <div className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--color-text-muted)] font-medium block">
              Solde fidélité disponible
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              Palier : <strong className="text-[var(--color-text)]">{customer.tier}</strong>
            </span>
          </div>
          <span className="text-xl font-extrabold text-[var(--color-primary)]">
            {customer.available_points.toLocaleString("fr-FR")} pts
          </span>
        </div>

        {/* 1. MONTANT DE L'ACHAT */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="redeem-amount-input"
              className="block text-xs font-semibold text-[var(--color-text)] tracking-wide"
            >
              1. Montant de l&apos;achat (€) *
            </label>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              (0 € si article 100% offert/remisé)
            </span>
          </div>

          <div className="relative">
            <input
              id="redeem-amount-input"
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0,00"
              className="w-full h-13 text-xl sm:text-2xl font-bold rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-4 pr-10 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--color-text-muted)] select-none pointer-events-none">
              €
            </span>
          </div>

          {/* Preset amount chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[var(--color-text-muted)] text-[11px] font-medium mr-1">Raccourcis montant :</span>
            {LOYALTY_CONFIG.presets.redeemAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountStr(preset.toString())}
                className="px-2.5 py-1 min-h-[30px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-mono text-[11px] transition-colors cursor-pointer"
              >
                {preset} €
              </button>
            ))}
          </div>
        </div>

        {/* 2. NOMBRE DE POINTS À DÉDUIRE */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="redeem-points-input"
              className="block text-xs font-semibold text-[var(--color-text)] tracking-wide"
            >
              2. Nombre de points à utiliser *
            </label>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Max : {customer.available_points} pts
            </span>
          </div>

          <div className="relative">
            <input
              id="redeem-points-input"
              type="number"
              min={1}
              max={customer.available_points}
              step={1}
              required
              value={pointsStr}
              onChange={(e) => setPointsStr(e.target.value)}
              placeholder="0"
              className="w-full h-13 text-xl sm:text-2xl font-bold rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-4 pr-12 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-muted)] select-none pointer-events-none">
              pts
            </span>
          </div>

          {/* Quick point chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[var(--color-text-muted)] text-[11px] font-medium mr-1">Raccourcis points :</span>
            {LOYALTY_CONFIG.presets.redeemPoints.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={preset > customer.available_points}
                onClick={() => setPointsStr(preset.toString())}
                className="px-2.5 py-1 min-h-[30px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-mono text-[11px] disabled:opacity-40 transition-colors cursor-pointer"
              >
                -{preset} pts
              </button>
            ))}
            {customer.available_points > 0 && (
              <button
                type="button"
                onClick={() => setPointsStr(customer.available_points.toString())}
                className="px-2.5 py-1 min-h-[30px] rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold text-[11px] hover:bg-[var(--color-primary)]/20 transition-colors cursor-pointer"
              >
                Tout le solde ({customer.available_points} pts)
              </button>
            )}
          </div>
        </div>

        {/* Warning if exceeding balance */}
        {isExceedingBalance && (
          <div className="p-3 rounded-[var(--radius-button,12px)] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>
              Solde insuffisant ! Le client ne dispose que de {customer.available_points} points.
            </span>
          </div>
        )}

        {/* Live Transaction Preview Card */}
        <div className="p-4 rounded-[var(--radius-card,16px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">Montant de l&apos;achat :</span>
            <strong className="text-[var(--color-text)] font-mono text-sm">
              {isValidAmount ? `${parsedAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : "—"}
            </strong>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">Points fidélité utilisés :</span>
            <strong className="text-rose-600 dark:text-rose-400 font-mono text-sm">
              {isValidPoints ? `-${pointsToRedeem} pts` : "—"}
            </strong>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">Points crédités :</span>
            <span className="inline-flex items-center gap-1 font-semibold text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
              0 pt (consommation)
            </span>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">Nouveau solde disponible :</span>
            <strong className="text-sm font-bold text-[var(--color-text)]">
              {remainingPoints.toLocaleString("fr-FR")} pts
            </strong>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] italic pt-1 border-t border-[var(--color-border)]/50">
            ℹ️ Règle fidélité : Aucun point n&apos;est crédité lors de l&apos;utilisation de points, même avec un montant d&apos;achat (le client consomme son avantage).
          </p>
        </div>

        {/* Reason input */}
        <Input
          label="Motif de l'opération"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Remise fidélité en caisse"
        />

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--color-border)]">
          <Button
            variant="secondary"
            type="button"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            disabled={!isValidPoints || isExceedingBalance || !isValidAmount}
          >
            {loading
              ? "Enregistrement..."
              : isValidPoints && isValidAmount
                ? `Valider (${parsedAmount.toFixed(2)} € · -${pointsToRedeem} pts)`
                : "Saisir montant et points"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
