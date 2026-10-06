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
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function CashierDashboard() {
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

  // Search effect with debounce
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/loyalty/customers?q=${encodeURIComponent(searchQuery)}`);
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

  return (
    <div className="h-full w-full overflow-hidden bg-[var(--color-background)] text-[var(--color-text)] flex flex-col font-sans">
      <CashierHeader cashier={cashier} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold text-xs py-3 px-5 rounded-[var(--radius-button,12px)] shadow-lg flex items-center gap-2">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* If a customer is selected, show Customer Detail View (§ 9 & § 16) */}
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
              Chargement de la fiche client...
            </p>
          </div>
        ) : (
          /* Search & Dashboard View (§ 3, § 5, § 16) */
          <div className="space-y-6">
            {/* Search Bar Card (§ 7 & § 8) */}
            <Card padded="lg" className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                  Recherche &amp; Gestion Client
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                  Saisissez un nom, prénom, numéro de téléphone ou email pour retrouver instantanément un client fidélité.
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
              <div className="flex items-center justify-between text-xs px-1 text-[var(--color-text-muted)]">
                <span>
                  {loading
                    ? "Recherche en cours..."
                    : `${customers.length} client(s) trouvé(s)`}
                </span>
                {searchQuery && (
                  <span className="font-mono opacity-80">filtre : &quot;{searchQuery}&quot;</span>
                )}
              </div>

              {customers.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {customers.map((c) => (
                    <CustomerCard
                      key={c.id}
                      customer={c}
                      onSelect={(cust) => loadCustomerDetail(cust.id)}
                    />
                  ))}
                </div>
              ) : !loading ? (
                <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-12 text-center bg-[var(--color-surface)]/60 space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] text-2xl">
                    🔍
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[var(--color-text)]">
                      Aucun client ne correspond à cette recherche
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                      Vérifiez l&apos;orthographe ou créez immédiatement un nouveau profil pour ce client.
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
              ) : null}
            </div>
          </div>
        )}
        </div>
      </main>

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

      {/* Modal 2: Ajouter un achat */}
      <AddPurchaseModal
        isOpen={isAddPurchaseOpen}
        customer={selectedCustomerDetail}
        onClose={() => setIsAddPurchaseOpen(false)}
        onPurchaseRecorded={(updatedCust) => {
          setSelectedCustomerDetail(updatedCust);
          showToast(`Achat enregistré ! Points crédités.`);
        }}
      />

      {/* Modal 3: Utiliser des points */}
      <RedeemPointsModal
        isOpen={isRedeemOpen}
        customer={selectedCustomerDetail}
        onClose={() => setIsRedeemOpen(false)}
        onPointsRedeemed={(updatedCust) => {
          setSelectedCustomerDetail(updatedCust);
          showToast(`Points déduits avec succès !`);
        }}
      />

      {/* Footer */}
      <footer className="shrink-0 border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">

        SuperMarket • Système de fidélité caissier (Jalon 1 MVP) • 1 € dépensé = 1 point
      </footer>
    </div>
  );
}
