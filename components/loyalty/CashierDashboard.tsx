"use client";

import React, { useEffect, useState, useTransition } from "react";
import { CustomerDetail, CustomerSummary, User } from "@/lib/loyalty/types";
import { CashierHeader } from "./CashierHeader";
import { SearchBar } from "./SearchBar";
import { CustomerCard } from "./CustomerCard";
import { CustomerDetailView } from "./CustomerDetailView";
import { NewCustomerModal } from "./NewCustomerModal";
import { AddPurchaseModal } from "./AddPurchaseModal";
import { RedeemPointsModal } from "./RedeemPointsModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface CashierDashboardProps {
  standalone?: boolean;
}

export function CashierDashboard({ standalone = false }: CashierDashboardProps) {
  const [cashier, setCashier] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [, startTransition] = useTransition();

  // Modals state
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  }

  // Load cashier info on mount
  useEffect(() => {
    async function loadCashier() {
      try {
        const res = await fetch("/api/loyalty/cashier/me");
        const data = await res.json();
        if (data.cashier) {
          setCashier(data.cashier);
        }
      } catch (err) {
        console.error("Erreur chargement caissier :", err);
      }
    }
    loadCashier();
  }, []);

  // Search effect: ONLY fetch and show results when a search term is entered
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/loyalty/customers?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!isCancelled && data.customers) {
          startTransition(() => {
            setCustomers(data.customers);
          });
        }
      } catch (err) {
        console.error("Erreur recherche clients :", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Load customer detail
  async function loadCustomerDetail(customerId: string) {
    setLoadingDetail(true);
    setSelectedCustomerId(customerId);
    try {
      const res = await fetch(`/api/loyalty/customers/${customerId}`);
      const data = await res.json();
      if (data.customer) {
        setSelectedCustomerDetail(data.customer);
      }
    } catch (err) {
      console.error("Erreur chargement détail client :", err);
    } finally {
      setLoadingDetail(false);
    }
  }

  const content = (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold text-xs py-3 px-5 rounded-[var(--radius-button,12px)] shadow-lg flex items-center gap-2">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* If a customer is selected, show Customer Detail View with points actions */}
      {selectedCustomerId && selectedCustomerDetail ? (
        <CustomerDetailView
          customer={selectedCustomerDetail}
          onBack={() => {
            setSelectedCustomerId(null);
            setSelectedCustomerDetail(null);
          }}
          onOpenAddPurchase={() => setIsAddPurchaseOpen(true)}
          onOpenRedeemPoints={() => setIsRedeemOpen(true)}
        />
      ) : loadingDetail ? (
        <div className="py-24 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[var(--color-primary)] border-t-transparent" />
          <p className="text-xs text-[var(--color-text-muted)] font-medium">
            Chargement de la fiche client et du solde de points...
          </p>
        </div>
      ) : (
        /* Search & Points Dashboard View */
        <div className="space-y-6">
          {/* Search Bar Card */}
          <Card padded="lg" className="space-y-5">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                Caisse &amp; Points de Fidélité
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                Recherchez un client au comptoir par nom, téléphone ou email pour consulter ses points, enregistrer un achat (1 € = 1 pt) ou utiliser ses points fidélité.
              </p>
            </div>

            <SearchBar
              query={searchQuery}
              onChange={setSearchQuery}
              onOpenNewCustomer={() => setIsNewCustomerOpen(true)}
            />
          </Card>

          {/* Results Section */}
          <div className="space-y-3">
            {searchQuery.trim() === "" ? (
              <div className="border border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-8 sm:p-12 text-center bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-hover)] space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <div className="inline-flex p-4 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  🔎
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">
                    Recherche client au comptoir
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                    Saisissez un nom, prénom, numéro de téléphone ou adresse email pour retrouver instantanément un compte client ou en créer un nouveau.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto text-xs">
                  <span className="px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                    ⚡ Recherche instantanée
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                    🎟️ 1 € dépensé = 1 point
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                    👑 Paliers Bronze à VIP
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs px-1 text-[var(--color-text-muted)]">
                  <span>
                    {loading
                      ? "Recherche en cours..."
                      : `${customers.length} résultat(s) pour « ${searchQuery} »`}
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
                    Recherche en cours dans la base de données...
                  </div>
                ) : customers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {customers.map((c) => (
                      <CustomerCard
                        key={c.id}
                        customer={c}
                        onSelect={(cust) => loadCustomerDetail(cust.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-12 text-center bg-[var(--color-surface)]/60 space-y-4">
                    <div className="inline-flex p-3 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] text-2xl">
                      ❌
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[var(--color-text)]">
                        Aucun client trouvé pour « {searchQuery} »
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                        Vérifiez l&apos;orthographe ou créez immédiatement un nouveau profil pour ce client directement depuis la caisse.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setIsNewCustomerOpen(true)}
                    >
                      <span>+ Créer ce client maintenant</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Nouveau Client */}
      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onCustomerCreated={(newCust) => {
          setIsNewCustomerOpen(false);
          showToast(`Client ${newCust.full_name} créé avec succès !`);
          setSelectedCustomerId(newCust.id);
          setSelectedCustomerDetail(newCust);
        }}
        onOpenExisting={(existingCust) => {
          setIsNewCustomerOpen(false);
          loadCustomerDetail(existingCust.id);
        }}
      />

      {/* Modal 2: Ajouter un achat (Calcul et crédit des points) */}
      <AddPurchaseModal
        isOpen={isAddPurchaseOpen}
        customer={selectedCustomerDetail}
        onClose={() => setIsAddPurchaseOpen(false)}
        onPurchaseRecorded={(updatedCust) => {
          setSelectedCustomerDetail(updatedCust);
          showToast("Achat enregistré et points crédités avec succès !");
        }}
      />

      {/* Modal 3: Utiliser des points fidélité (Déduction et contrôle solde) */}
      <RedeemPointsModal
        isOpen={isRedeemOpen}
        customer={selectedCustomerDetail}
        onClose={() => setIsRedeemOpen(false)}
        onPointsRedeemed={(updatedCust) => {
          setSelectedCustomerDetail(updatedCust);
          showToast("Points fidélité utilisés avec succès !");
        }}
      />
    </div>
  );

  if (!standalone) {
    return content;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      <CashierHeader
        cashier={cashier}
      />
      <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {content}
      </main>
    </div>
  );
}
