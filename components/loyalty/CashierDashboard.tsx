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
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

export interface CashierDashboardProps {
  standalone?: boolean;
}

export function CashierDashboard({ standalone = false }: CashierDashboardProps) {
  const [cashier, setCashier] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, LOYALTY_CONFIG.search.debounceMs);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [, startTransition] = useTransition();

  const {
    paginatedItems: paginatedCustomers,
    page: customerPage,
    pageSize: customerPageSize,
    totalPages: customerTotalPages,
    totalItems: customerTotalItems,
    setPage: setCustomerPage,
    setPageSize: setCustomerPageSize,
  } = usePagination(customers, {
    defaultPageSize: LOYALTY_CONFIG.pagination.tablePageSize,
  });

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

  // Search effect: executes ONLY when debouncedSearchQuery changes with AbortController
  useEffect(() => {
    const trimmed = debouncedSearchQuery.trim();
    if (!trimmed) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    setLoading(true);

    async function fetchCustomers() {
      try {
        const res = await fetch(
          `/api/loyalty/customers?q=${encodeURIComponent(trimmed)}`,
          { signal: abortController.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.customers) {
            startTransition(() => {
              setCustomers(data.customers);
            });
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Erreur recherche clients :", err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchCustomers();

    return () => {
      abortController.abort();
    };
  }, [debouncedSearchQuery]);

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
              loading={loading || (searchQuery.trim() !== "" && searchQuery !== debouncedSearchQuery)}
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
                    {loading || searchQuery !== debouncedSearchQuery
                      ? "Recherche en cours..."
                      : `${customers.length} résultat(s) pour « ${debouncedSearchQuery || searchQuery} »`}
                  </span>
                </div>

                {loading || searchQuery !== debouncedSearchQuery ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 sm:p-5 rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="h-11 w-11 rounded-full bg-[var(--color-border)]/60 shrink-0" />
                          <div className="space-y-2">
                            <div className="h-4 w-36 bg-[var(--color-border)]/80 rounded-md" />
                            <div className="h-3 w-52 bg-[var(--color-border)]/50 rounded-md" />
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                          <div className="h-6 w-20 bg-[var(--color-border)]/60 rounded-full" />
                          <div className="h-10 w-28 bg-[var(--color-border)]/70 rounded-[var(--radius-button,12px)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : customers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {paginatedCustomers.map((c) => (
                        <CustomerCard
                          key={c.id}
                          customer={c}
                          onSelect={(cust) => loadCustomerDetail(cust.id)}
                        />
                      ))}
                    </div>

                    <Pagination
                      page={customerPage}
                      totalPages={customerTotalPages}
                      totalItems={customerTotalItems}
                      pageSize={customerPageSize}
                      onPageChange={setCustomerPage}
                      onPageSizeChange={setCustomerPageSize}
                      pageSizeOptions={[5, 10, 20]}
                      alwaysShow={true}
                    />
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
          showToast("Achat enregistré et points déduits avec succès !");
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
