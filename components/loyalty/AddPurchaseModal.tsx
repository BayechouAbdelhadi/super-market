"use client";

import React, { useState } from "react";
import { CustomerDetail } from "@/lib/loyalty/types";
import { calculatePoints } from "@/lib/loyalty/domain";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import { Modal, ModalDetails, modalSplitLayout } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface AddPurchaseModalProps {
  isOpen: boolean;
  customer: CustomerDetail | null;
  onClose: () => void;
  onPurchaseRecorded: (updatedCustomer: CustomerDetail) => void;
  euroToPointsRatio?: number;
  quickPurchaseAmounts?: number[];
}

export function AddPurchaseModal({
  isOpen,
  customer,
  onClose,
  onPurchaseRecorded,
  euroToPointsRatio = LOYALTY_CONFIG.conversion.euroToPointsRatio,
  quickPurchaseAmounts,
}: AddPurchaseModalProps) {
  const [amountStr, setAmountStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !customer) return null;

  const presets = quickPurchaseAmounts && quickPurchaseAmounts.length > 0
    ? quickPurchaseAmounts
    : [...LOYALTY_CONFIG.presets.purchaseAmounts];

  const parsedAmount = parseFloat(amountStr.replace(",", "."));
  const pointsEarned =
    !isNaN(parsedAmount) && parsedAmount > 0 ? calculatePoints(parsedAmount, euroToPointsRatio) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Veuillez saisir un montant valide strictement supérieur à 0 €.");
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

      onPurchaseRecorded(data.customer);
      setAmountStr("");
      onClose();
    } catch {
      const netError = "Erreur réseau ou serveur inaccessible.";
      setErrorMsg(netError);
      toast.error(netError);
    } finally {
      setLoading(false);
    }
  }

  // Any edit clears the last error so the preview comes back
  function changeAmount(value: string) {
    setErrorMsg("");
    setAmountStr(value);
  }

  function handleClose() {
    setAmountStr("");
    setErrorMsg("");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enregistrer un achat"
      icon="🧾"
      description={`Client : ${customer.full_name}`}
    >
      <form onSubmit={handleSubmit} className={`p-6 tablet:p-4 ${modalSplitLayout.form}`}>
        <div className={modalSplitLayout.main}>
          <div className={modalSplitLayout.inputs}>
            {/* Large Amount Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="purchase-amount"
                className="block text-xs font-semibold text-[var(--color-text)] tracking-wide"
              >
                Montant du ticket de caisse (€) *
              </label>
              <div className="relative">
                <input
                  id="purchase-amount"
                  type="text"
                  inputMode="decimal"
                  required
                  autoFocus
                  value={amountStr}
                  onChange={(e) => changeAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-14 tablet:h-12 text-2xl sm:text-3xl tablet:text-xl font-bold rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-4 pr-12 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[var(--color-text-muted)] select-none pointer-events-none">
                  €
                </span>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--color-text-muted)] font-medium">Montants fréquents :</span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => changeAmount(preset.toString())}
                  className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-mono text-[11px] transition-colors cursor-pointer"
                >
                  {preset.toFixed(2)} €
                </button>
              ))}
            </div>

          </div>

          <div className={modalSplitLayout.details}>
            <ModalDetails alert={errorMsg ? { message: errorMsg, tone: "danger" } : null}>
              {/* Confirmation & Points Preview Card (§ 18) */}
              <div className="p-4 sm:p-5 tablet:p-3 rounded-[var(--radius-card,16px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] space-y-3 tablet:space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Règle d&apos;attribution</span>
                  <span className="font-medium text-[var(--color-text)]">
                    1 € dépensé = {euroToPointsRatio} point{euroToPointsRatio > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="pt-2 tablet:pt-1.5 border-t border-[var(--color-border)] flex items-end justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold block">
                      Montant saisi
                    </span>
                    <span className="text-2xl sm:text-3xl tablet:text-xl font-extrabold text-[var(--color-text)]">
                      {!isNaN(parsedAmount) && parsedAmount > 0
                        ? `${parsedAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                        : "0,00 €"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold block">
                      Points à créditer
                    </span>
                    <span className="text-2xl sm:text-3xl tablet:text-xl font-extrabold text-[var(--color-primary)]">
                      +{pointsEarned} pts
                    </span>
                  </div>
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
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            disabled={pointsEarned <= 0}
          >
            {loading ? "Enregistrement..." : `Confirmer l'achat (+${pointsEarned} pts)`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
