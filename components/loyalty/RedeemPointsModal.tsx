"use client";

import React, { useState } from "react";
import { CustomerDetail } from "@/lib/loyalty/types";
import { Modal, ModalDetails, modalSplitLayout, type ModalAlert } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import {
  calculatePoints,
  calculateMaxPointsForAmount,
  calculateMaxRedeemablePoints,
} from "@/lib/loyalty/domain";
import { toast } from "@/components/ui/sonner";

function formatEuro(value: number): string {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

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

  // One message at a time, shown in place of the ticket summary
  const alert: ModalAlert | null = errorMsg
    ? { message: errorMsg, tone: "danger" }
    : isExceedingBalance
      ? { message: `Solde insuffisant : ${customer.available_points} pts disponibles.`, tone: "danger" }
      : isExceedingAmount
        ? {
            message: `Remise supérieure au ticket (pas de rendu de monnaie). Maximum : ${maxPointsForAmount} pts.`,
            tone: "warning",
          }
        : null;

  // Any edit clears the last error so the summary comes back
  function changeAmount(value: string) {
    setErrorMsg("");
    setAmountStr(value);
  }

  function changePoints(value: string) {
    setErrorMsg("");
    setPointsStr(value);
  }

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
      description={
        <span className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-semibold text-[var(--color-text)]">
            {customer.full_name}
          </span>
          <span className="text-[var(--color-text-muted)] opacity-50">·</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text)]">
            Palier {customer.tier}
          </span>
          <span className="text-[var(--color-text-muted)] opacity-50">·</span>
          <span className="inline-flex items-center gap-1 font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--color-primary)]/20">
            <span>Solde :</span>
            <span className="font-mono text-xs font-black">{customer.available_points.toLocaleString("fr-FR")} pts</span>
          </span>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className={`p-6 tablet:p-4 ${modalSplitLayout.form}`}>
        <div className={modalSplitLayout.main}>
          <div className={modalSplitLayout.inputs}>
            {/* 1. MONTANT DU TICKET */}
            <div className="space-y-2">
              <label
                htmlFor="redeem-amount-input"
                className="block text-sm font-semibold text-[var(--color-text)]"
              >
                1. Montant du ticket
              </label>
              <div className="relative">
                <input
                  id="redeem-amount-input"
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={amountStr}
                  onChange={(e) => changeAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-14 tablet:h-12 text-2xl tablet:text-xl font-bold rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-4 pr-12 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[var(--color-text-muted)] select-none pointer-events-none">
                  €
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {purchasePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => changeAmount(preset.toString())}
                    className="min-h-[44px] px-4 rounded-[var(--radius-button,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {preset} €
                  </button>
                ))}
              </div>
            </div>

            {/* 2. POINTS À UTILISER */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor="redeem-points-input"
                  className="block text-sm font-semibold text-[var(--color-text)]"
                >
                  2. Points à utiliser
                </label>
                {!cannotRedeem && isPurchaseAmountEntered && (
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Max : {maxAllowedPointsForTx.toLocaleString("fr-FR")} pts
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="redeem-points-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  disabled={cannotRedeem || !isPurchaseAmountEntered}
                  value={cannotRedeem ? "" : pointsStr}
                  onChange={(e) => changePoints(e.target.value.replace(/\D/g, ""))}
                  placeholder={
                    cannotRedeem
                      ? "Points indisponibles"
                      : !isPurchaseAmountEntered
                        ? "Saisir le montant d'abord"
                        : "0"
                  }
                  className="w-full h-14 tablet:h-12 text-2xl tablet:text-xl font-bold rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-4 pr-14 text-[var(--color-text)] placeholder:text-base placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-text-muted)] select-none pointer-events-none">
                  pts
                </span>
              </div>

              {cannotRedeem && (
                <p className="text-sm text-warning-text font-medium">
                  🔒{" "}
                  {customer.available_points <= 0
                    ? "Aucun point disponible : enregistrez un achat normal."
                    : `Minimum ${minPointsToRedeem} pts requis (solde : ${customer.available_points} pts) : enregistrez un achat normal.`}
                </p>
              )}

              {!cannotRedeem && isPurchaseAmountEntered && (
                <div className="flex flex-wrap gap-2">
                  {maxAllowedPointsForTx > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (minPointsToRedeem > 0 && maxAllowedPointsForTx < minPointsToRedeem) {
                          toast.error(
                            `Seuil minimum non atteint : un minimum de ${minPointsToRedeem} points est requis pour utiliser une remise.`
                          );
                        }
                        changePoints(maxAllowedPointsForTx.toString());
                      }}
                      className="min-h-[44px] px-4 rounded-[var(--radius-button,12px)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold hover:bg-[var(--color-primary)]/20 transition-colors cursor-pointer"
                    >
                      Max · -{(maxAllowedPointsForTx * pointValueInEuro).toFixed(2)} €
                    </button>
                  )}
                  {pointsPresets
                    .filter((preset) => preset <= maxAllowedPointsForTx)
                    .map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (minPointsToRedeem > 0 && preset < minPointsToRedeem) {
                            toast.error(
                              `Seuil minimum non atteint : un minimum de ${minPointsToRedeem} points est requis pour utiliser une remise.`
                            );
                          }
                          changePoints(preset.toString());
                        }}
                        className="min-h-[44px] px-4 rounded-[var(--radius-button,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] text-sm font-semibold transition-colors cursor-pointer"
                      >
                        {preset} pts
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className={modalSplitLayout.details}>
            <ModalDetails alert={alert}>
              {/* Ticket summary: what the cashier collects */}
              <div className="p-5 tablet:p-3 rounded-[var(--radius-card,16px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-3 tablet:space-y-0 tablet:grid tablet:grid-cols-4 tablet:gap-3">
                <div className="flex items-center justify-between text-sm tablet:flex-col tablet:items-start tablet:justify-start tablet:gap-0.5">
                  <span className="text-[var(--color-text-muted)]">Montant du ticket</span>
                  <span className="font-semibold text-[var(--color-text)]">
                    {formatEuro(isPurchaseAmountEntered ? parsedAmount : 0)}
                  </span>
                </div>

                {cannotRedeem ? (
                  <div className="flex items-center justify-between text-sm tablet:flex-col tablet:items-start tablet:justify-start tablet:gap-0.5">
                    <span className="text-[var(--color-text-muted)]">Points gagnés</span>
                    <span className="font-semibold text-success-text">+{normalPointsEarned} pts</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm tablet:flex-col tablet:items-start tablet:justify-start tablet:gap-0.5">
                    <span className="text-[var(--color-text-muted)]">
                      Remise fidélité{isValidPoints ? ` (${pointsToRedeem} pts)` : ""}
                    </span>
                    <span className={`text-3xl tablet:text-2xl font-extrabold ${isValidPoints ? "text-success-text" : "text-[var(--color-text-muted)]"}`}>
                      -{formatEuro(discountEuro)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--color-border)] flex items-end justify-between gap-3 tablet:pt-0 tablet:border-t-0 tablet:flex-col tablet:items-start tablet:justify-start tablet:gap-0.5">
                  <span className="text-sm font-semibold text-[var(--color-text)] pb-1 tablet:pb-0">À encaisser</span>
                  <span className={`text-3xl tablet:text-2xl font-extrabold ${isExceedingAmount ? "text-danger-text line-through" : "text-[var(--color-primary)]"}`}>
                    {formatEuro(cannotRedeem ? (isPurchaseAmountEntered ? parsedAmount : 0) : netPayable)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm tablet:flex-col tablet:items-start tablet:justify-start tablet:gap-0.5">
                  <span className="text-[var(--color-text-muted)]">Nouveau solde client</span>
                  <span className="font-semibold text-[var(--color-text)]">
                    {(cannotRedeem ? customer.available_points + normalPointsEarned : remainingPoints).toLocaleString("fr-FR")} pts
                  </span>
                </div>
              </div>
            </ModalDetails>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={modalSplitLayout.actions}>
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
              disabled={!isPurchaseAmountEntered}
              onClick={() => handleNormalPurchase()}
            >
              {loading ? "Enregistrement..." : `Achat normal (+${normalPointsEarned} pts)`}
            </Button>
          ) : (
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={
                !isValidPoints ||
                isExceedingBalance ||
                !isPurchaseAmountEntered ||
                isExceedingAmount
              }
            >
              {loading
                ? "Enregistrement..."
                : isValidPoints && isPurchaseAmountEntered && !isExceedingAmount
                  ? `Valider · ${formatEuro(netPayable)}`
                  : "Valider"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
