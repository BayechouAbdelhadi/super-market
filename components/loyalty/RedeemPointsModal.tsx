"use client";

import React, { useState } from "react";
import { CustomerDetail } from "@/lib/loyalty/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import {
  calculatePoints,
  calculateMaxPointsForAmount,
  calculateMaxRedeemablePoints,
} from "@/lib/loyalty/domain";
import { toast } from "@/components/ui/sonner";

interface RedeemPointsModalProps {
  isOpen: boolean;
  customer: CustomerDetail | null;
  onClose: () => void;
  onPointsRedeemed: (updatedCustomer: CustomerDetail) => void;
  onPurchaseRecorded?: (updatedCustomer: CustomerDetail) => void;
  pointValueInEuro?: number;
  euroToPointsRatio?: number;
  quickPurchaseAmounts?: number[];
  quickRedeemPoints?: number[];
  minPointsToRedeem?: number;
  maxDiscountPerTransactionEuro?: number;
  defaultRedeemReason?: string;
}

export function RedeemPointsModal({
  isOpen,
  customer,
  onClose,
  onPointsRedeemed,
  onPurchaseRecorded,
  pointValueInEuro = LOYALTY_CONFIG.conversion.pointValueInEuro,
  euroToPointsRatio = LOYALTY_CONFIG.conversion.euroToPointsRatio,
  quickPurchaseAmounts,
  quickRedeemPoints,
  minPointsToRedeem = 50,
  maxDiscountPerTransactionEuro = 50.0,
  defaultRedeemReason = LOYALTY_CONFIG.defaults.redeemReason,
}: RedeemPointsModalProps) {
  // Both required inputs: purchase amount (€) and points to redeem
  const [amountStr, setAmountStr] = useState("");
  const [pointsStr, setPointsStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    if (isOpen && customer && minPointsToRedeem > 0 && customer.available_points < minPointsToRedeem) {
      toast.error(
        `Seuil minimum non atteint : un minimum de ${minPointsToRedeem} points est requis pour utiliser une remise.`
      );
    }
  }, [isOpen, customer, minPointsToRedeem]);

  if (!isOpen || !customer) return null;

  const rawPurchasePresets = quickPurchaseAmounts && quickPurchaseAmounts.length > 0
    ? quickPurchaseAmounts
    : [...LOYALTY_CONFIG.presets.redeemAmounts];
  // Filter out any 0 € presets since a purchase amount > 0 is mandatory to apply points
  const purchasePresets = rawPurchasePresets.filter((p) => p > 0);

  const pointsPresets = quickRedeemPoints && quickRedeemPoints.length > 0
    ? quickRedeemPoints
    : [...LOYALTY_CONFIG.presets.redeemPoints];

  // Amount parsing & validation (must be > 0 to redeem points: no money given back)
  const rawAmount = amountStr.trim().replace(",", ".");
  const parsedAmount = rawAmount === "" ? 0 : parseFloat(rawAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 0;
  const isPurchaseAmountEntered = isValidAmount && parsedAmount > 0;

  // Maximum points authorized based strictly on the purchase amount (amount - points * pointValue >= 0)
  const maxPointsForAmount = isPurchaseAmountEntered
    ? calculateMaxPointsForAmount(parsedAmount, pointValueInEuro)
    : 0;

  // Effective maximum points that can be redeemed (bounded by balance, amount, and store cap)
  const maxAllowedPointsForTx = calculateMaxRedeemablePoints(
    customer.available_points,
    isPurchaseAmountEntered ? parsedAmount : 0,
    {
      minPointsToRedeem,
      maxDiscountPerTransactionEuro,
      pointValueInEuro,
    }
  );

  // Points parsing & validation
  const cannotRedeem =
    customer.available_points <= 0 ||
    (minPointsToRedeem > 0 && customer.available_points < minPointsToRedeem);
  const pointsToRedeem = parseInt(pointsStr.trim(), 10);
  const isValidPoints = !cannotRedeem && Number.isInteger(pointsToRedeem) && pointsToRedeem > 0;
  const isExceedingBalance = isValidPoints && pointsToRedeem > customer.available_points;
  const isExceedingAmount =
    isValidPoints && isPurchaseAmountEntered && pointsToRedeem > maxPointsForAmount;
  const isAmountMissingForPoints = isValidPoints && !isPurchaseAmountEntered;

  const discountEuro = isValidPoints
    ? Math.round(pointsToRedeem * pointValueInEuro * 100) / 100
    : 0;

  const netPayable = isPurchaseAmountEntered
    ? Math.max(0, Math.round((parsedAmount - discountEuro) * 100) / 100)
    : 0;

  const remainingPoints =
    isValidPoints && !isExceedingBalance && !isExceedingAmount
      ? customer.available_points - pointsToRedeem
      : customer.available_points;

  const normalPointsEarned =
    !isNaN(parsedAmount) && parsedAmount > 0
      ? calculatePoints(parsedAmount, euroToPointsRatio)
      : 0;

  async function handleNormalPurchase(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (!isValidAmount || parsedAmount <= 0) {
      const msg = "Veuillez saisir un montant d'achat valide (supérieur à 0 €).";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/customers/${customer?.id}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.message || "Erreur lors de l'enregistrement de l'achat.";
        setErrorMsg(errorText);
        toast.error(errorText);
        return;
      }

      if (onPurchaseRecorded) {
        onPurchaseRecorded(data.customer);
      } else {
        toast.success(
          `Achat de ${parsedAmount.toFixed(2)} € enregistré avec succès ! +${data.movement?.points ?? normalPointsEarned} points cumulés.`
        );
        onPointsRedeemed(data.customer);
      }

      setAmountStr("");
      setPointsStr("");
      onClose();
    } catch {
      const netError = "Erreur réseau ou serveur inaccessible.";
      setErrorMsg(netError);
      toast.error(netError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (cannotRedeem) {
      return handleNormalPurchase(e);
    }

    if (!isValidAmount || !isPurchaseAmountEntered) {
      const msg = "Veuillez saisir un montant d'achat valide (supérieur à 0 €) pour utiliser des points.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!isValidPoints) {
      const msg = "Veuillez saisir le nombre de points fidélité à déduire (strictement supérieur à 0).";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (isExceedingBalance) {
      const msg = `Impossible de déduire plus de points que le solde disponible (${customer?.available_points} max).`;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (isExceedingAmount) {
      const msg = `La remise (${discountEuro.toFixed(2)} €) ne peut pas dépasser le montant de l'achat (${parsedAmount.toFixed(2)} €). Aucun rendu de monnaie n'est autorisé. Maximum utilisable : ${maxPointsForAmount} points.`;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (minPointsToRedeem > 0 && pointsToRedeem < minPointsToRedeem) {
      const msg = `Seuil minimum non atteint : un minimum de ${minPointsToRedeem} points est requis pour utiliser une remise.`;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (maxDiscountPerTransactionEuro > 0) {
      const discountEuroCalc = pointsToRedeem * pointValueInEuro;
      if (discountEuroCalc > maxDiscountPerTransactionEuro) {
        const maxPts = Math.floor(maxDiscountPerTransactionEuro / pointValueInEuro);
        const msg = `La remise maximale autorisée par passage en caisse est de ${maxDiscountPerTransactionEuro.toFixed(2)} € (soit maximum ${maxPts} points).`;
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/customers/${customer?.id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          points: pointsToRedeem,
          reason: defaultRedeemReason || "Remise fidélité en caisse",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.message || "Erreur lors de la validation de la déduction.";
        setErrorMsg(errorText);
        toast.error(errorText);
        return;
      }

      onPointsRedeemed(data.customer);
      setAmountStr("");
      setPointsStr("");
      onClose();
    } catch {
      const netError = "Erreur réseau ou serveur inaccessible.";
      setErrorMsg(netError);
      toast.error(netError);
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
              (Plafond de points calculé sur ce montant)
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
            {purchasePresets.map((preset) => (
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
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
              {isPurchaseAmountEntered
                ? `Max pour cet achat : ${Math.min(customer.available_points, maxPointsForAmount)} pts`
                : `Solde : ${customer.available_points} pts`}
            </span>
          </div>

          <div className="relative">
            <input
              id="redeem-points-input"
              type="number"
              min={minPointsToRedeem > 0 ? minPointsToRedeem : 1}
              max={isPurchaseAmountEntered ? Math.min(customer.available_points, maxPointsForAmount) : customer.available_points}
              step={1}
              required
              disabled={cannotRedeem || !isPurchaseAmountEntered}
              value={cannotRedeem ? "" : pointsStr}
              onChange={(e) => setPointsStr(e.target.value)}
              placeholder={
                cannotRedeem
                  ? "Points indisponibles"
                  : !isPurchaseAmountEntered
                    ? "Saisir le montant d'abord"
                    : "0"
              }
              className="w-full h-13 text-xl sm:text-2xl font-bold rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-4 pr-12 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-muted)] select-none pointer-events-none">
              pts
            </span>
          </div>

          {cannotRedeem && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 pt-1">
              <span>🔒</span>
              <span>
                {customer.available_points <= 0
                  ? "Solde de points épuisé (0 pt disponible)."
                  : `Seuil minimum non atteint : un minimum de ${minPointsToRedeem} points est requis pour utiliser une remise (solde : ${customer.available_points} pts).`}
              </span>
            </p>
          )}

          {!cannotRedeem && !isPurchaseAmountEntered && (
            <p className="text-xs text-[var(--color-text-muted)] font-medium flex items-center gap-1.5 pt-1">
              <span>💡</span>
              <span>Indiquez le montant de l&apos;achat pour débloquer l&apos;utilisation des points (aucun rendu de monnaie).</span>
            </p>
          )}

          {/* Quick point chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[var(--color-text-muted)] text-[11px] font-medium mr-1">Raccourcis points :</span>
            {pointsPresets.map((preset) => {
              const isDisabled =
                cannotRedeem ||
                !isPurchaseAmountEntered ||
                preset > customer.available_points ||
                preset > maxPointsForAmount;
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (minPointsToRedeem > 0 && preset < minPointsToRedeem) {
                      toast.error(
                        `Seuil minimum non atteint : un minimum de ${minPointsToRedeem} points est requis pour utiliser une remise.`
                      );
                    }
                    setPointsStr(preset.toString());
                  }}
                  className="px-2.5 py-1 min-h-[30px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-mono text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  -{preset} pts
                </button>
              );
            })}
            {customer.available_points > 0 && isPurchaseAmountEntered && maxAllowedPointsForTx > 0 && (
              <button
                type="button"
                disabled={cannotRedeem}
                onClick={() => {
                  if (minPointsToRedeem > 0 && maxAllowedPointsForTx < minPointsToRedeem) {
                    toast.error(
                      `Seuil minimum non atteint : un minimum de ${minPointsToRedeem} points est requis pour utiliser une remise.`
                    );
                  }
                  setPointsStr(maxAllowedPointsForTx.toString());
                }}
                className="px-2.5 py-1 min-h-[30px] rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold text-[11px] hover:bg-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {customer.available_points <= maxPointsForAmount
                  ? `Tout le solde (${customer.available_points} pts)`
                  : `Max possible (${maxAllowedPointsForTx} pts · -${(maxAllowedPointsForTx * pointValueInEuro).toFixed(2)} €)`}
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

        {/* Warning if exceeding purchase amount (no money given) */}
        {isExceedingAmount && (
          <div className="p-3 rounded-[var(--radius-button,12px)] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 font-medium flex items-start gap-2">
            <span className="shrink-0 text-sm">⚠️</span>
            <div>
              <strong className="block font-semibold">Aucun rendu de monnaie autorisé</strong>
              La remise calculée ({discountEuro.toFixed(2)} €) dépasse le montant du ticket ({parsedAmount.toFixed(2)} €).
              Pour cet achat, le maximum utilisable est de <strong>{maxPointsForAmount} points</strong> (soit {(maxPointsForAmount * pointValueInEuro).toFixed(2)} € de remise max).
            </div>
          </div>
        )}

        {/* Compact Live Transaction Summary Bar */}
        <div className="p-3 sm:p-3.5 rounded-[var(--radius-card,16px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] grid grid-cols-3 gap-2 items-center text-center">
          {cannotRedeem ? (
            <>
              <div className="text-left sm:text-center">
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] block">Points gagnés</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{normalPointsEarned} pts
                </span>
              </div>

              <div className="px-2 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                  Total à encaisser
                </span>
                <span className="text-sm sm:text-base font-mono font-extrabold text-[var(--color-text)]">
                  {isPurchaseAmountEntered ? `${parsedAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : "0,00 €"}
                </span>
              </div>

              <div className="text-right sm:text-center">
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] block">Nouveau solde</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-[var(--color-text)]">
                  {(customer.available_points + normalPointsEarned).toLocaleString("fr-FR")} pts
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-left sm:text-center">
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] block">Remise</span>
                <div className="flex flex-col sm:items-center">
                  <span className={`text-xs sm:text-sm font-mono font-bold ${isValidPoints ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--color-text-muted)]"}`}>
                    {isValidPoints ? `-${discountEuro.toFixed(2)} €` : "0,00 €"}
                  </span>
                  {isValidPoints && (
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                      (-{pointsToRedeem} pts)
                    </span>
                  )}
                </div>
              </div>

              <div className="px-2 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                  Reste à payer
                </span>
                <span className={`text-sm sm:text-base font-mono font-black ${isExceedingAmount ? "text-rose-600 dark:text-rose-400 line-through" : "text-[var(--color-text)]"}`}>
                  {isPurchaseAmountEntered ? `${netPayable.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : "0,00 €"}
                </span>
              </div>

              <div className="text-right sm:text-center">
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] block">Nouveau solde</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-[var(--color-text)]">
                  {remainingPoints.toLocaleString("fr-FR")} pts
                </span>
              </div>
            </>
          )}
        </div>


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

          {cannotRedeem ? (
            <Button
              variant="primary"
              type="button"
              loading={loading}
              disabled={!isValidAmount || parsedAmount <= 0}
              onClick={() => handleNormalPurchase()}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>
                {loading
                  ? "Enregistrement de l'achat..."
                  : isValidAmount && parsedAmount > 0
                    ? `Valider l'achat normal (${parsedAmount.toFixed(2)} € · +${normalPointsEarned} pts)`
                    : "Saisir un montant d'achat"}
              </span>
            </Button>
          ) : (
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={
                cannotRedeem ||
                !isValidPoints ||
                isExceedingBalance ||
                !isValidAmount ||
                !isPurchaseAmountEntered ||
                isExceedingAmount
              }
            >
              {loading
                ? "Enregistrement..."
                : isValidPoints && isPurchaseAmountEntered && !isExceedingAmount
                  ? `Valider (${parsedAmount.toFixed(2)} € · -${pointsToRedeem} pts · Reste : ${netPayable.toFixed(2)} €)`
                  : "Saisir montant et points"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
