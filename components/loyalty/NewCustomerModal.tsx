"use client";

import React, { useState } from "react";
import { CustomerDetail, CustomerSummary } from "@/lib/loyalty/types";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: CustomerDetail) => void;
  onOpenExisting?: (existingCustomer: CustomerSummary) => void;
  title?: string;
  description?: string;
}

export function NewCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
  onOpenExisting,
  title,
  description,
}: NewCustomerModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [duplicateInfo, setDuplicateInfo] = useState<{
    field: "phone" | "email";
    message: string;
    existingCustomer: CustomerSummary;
  } | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setDuplicateInfo(null);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg("Tous les champs marqués d'une étoile (*) sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/loyalty/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
          email,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.existingCustomer) {
        setDuplicateInfo({
          field: data.field,
          message: data.message,
          existingCustomer: data.existingCustomer,
        });
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.message || "Erreur lors de la création du client.");
        return;
      }

      // Success
      onCustomerCreated(data.customer);
      handleReset();
    } catch {
      setErrorMsg("Erreur réseau ou serveur inaccessible.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setErrorMsg("");
    setDuplicateInfo(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={title || "Nouveau client fidélité"}
      icon="👤"
      description={description || "Créez un profil client fidélité en quelques secondes."}
    >
      {/* Duplicate Warning Banner */}
      {duplicateInfo && (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/60 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {duplicateInfo.message}
              </h4>
              <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                <div>{duplicateInfo.existingCustomer.full_name}</div>
                <div className="font-mono">{duplicateInfo.existingCustomer.phone}</div>
              </div>
            </div>
          </div>

          {onOpenExisting && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                onOpenExisting(duplicateInfo.existingCustomer);
                handleReset();
              }}
            >
              Ouvrir la fiche de ce client
            </Button>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorMsg && !duplicateInfo && (
          <div className="p-3 rounded-[var(--radius-button,12px)] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Prénom *"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ahmed"
            autoFocus
          />

          <Input
            label="Nom *"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Bayechou"
          />
        </div>

        <Input
          label="Téléphone *"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="06 12 34 56 78"
          helperText="Tous les formats usuels sont acceptés (espaces, points, compact)."
        />

        <Input
          label="Email *"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ahmed@example.com"
        />

        {/* Footer Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--color-border)]">
          <Button
            variant="secondary"
            type="button"
            onClick={handleReset}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
          >
            {loading ? "Création en cours..." : "Créer le client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
