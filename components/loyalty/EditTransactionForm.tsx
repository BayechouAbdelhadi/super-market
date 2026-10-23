"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Transaction } from "@/lib/loyalty/types";
import { calculatePoints } from "@/lib/loyalty/domain";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface EditTransactionFormProps {
  transaction: Transaction;
  customerName: string;
  /** Where to go once saved or cancelled (the till, with the customer reopened) */
  returnHref: string;
  euroToPointsRatio: number;
  pointValueInEuro: number;
}

const formatEuro = (value: number) =>
  value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function EditTransactionForm({
  transaction,
  customerName,
  returnHref,
  euroToPointsRatio,
  pointValueInEuro,
}: EditTransactionFormProps) {
  const router = useRouter();
  const oldAmount = Number(transaction.amount_total) || 0;
  const oldEarned = Number(transaction.points_earned) || 0;
  const oldRedeemed = Number(transaction.points_redeemed) || 0;
  const isRedemption = oldRedeemed > 0;

  const [amount, setAmount] = useState(oldAmount.toFixed(2));
  const [points, setPoints] = useState(String(oldRedeemed));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = parseFloat(amount.replace(",", "."));
  const parsedPoints = parseInt(points, 10);
  const newEarned = isRedemption ? 0 : calculatePoints(parsedAmount, euroToPointsRatio);
  const balanceDelta = isRedemption ? oldRedeemed - (parsedPoints || 0) : newEarned - oldEarned;
  const unchanged = parsedAmount === oldAmount && (!isRedemption || parsedPoints === oldRedeemed);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/loyalty/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          ...(isRedemption ? { points_redeemed: parsedPoints } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Impossible de modifier la transaction.");
        return;
      }
      toast.success("Transaction corrigée.");
      router.push(returnHref);
    } catch {
      setError("Erreur réseau : la transaction n'a pas été modifiée.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padded="lg" className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-[var(--color-text-muted)]">{customerName}</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {isRedemption ? "Utilisation de points" : "Achat"} du{" "}
          {new Date(transaction.created_at).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {formatEuro(oldAmount)} € · {isRedemption ? `-${oldRedeemed}` : `+${oldEarned}`} points
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Montant du ticket (€)"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />

        {isRedemption && (
          <Input
            label="Points utilisés"
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            helperText={
              parsedPoints > 0 ? `Remise : ${formatEuro(parsedPoints * pointValueInEuro)} €` : undefined
            }
            required
          />
        )}

        <div className="rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] p-4 space-y-1">
          <p className="text-2xl font-bold text-[var(--color-text)]">
            {isNaN(parsedAmount) ? "—" : `${formatEuro(parsedAmount)} €`}
          </p>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            {isRedemption ? `-${parsedPoints || 0} points` : `+${newEarned} points`}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Solde du client : {balanceDelta >= 0 ? "+" : ""}
            {balanceDelta} points par rapport à aujourd&apos;hui
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button type="button" variant="secondary" size="lg" onClick={() => router.push(returnHref)}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={saving || unchanged || isNaN(parsedAmount) || (isRedemption && !(parsedPoints > 0))}
          >
            {saving ? "Enregistrement..." : "Enregistrer la correction"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
