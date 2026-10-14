"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { AppSettings } from "@/lib/settings/types";
import { toast } from "@/components/ui/sonner";

export interface CashierDashboardProps {
  standalone?: boolean;
  settings?: AppSettings;
}

export function CashierDashboard({ standalone = false, settings: propSettings }: CashierDashboardProps) {
  const [currentSettings, setCurrentSettings] = useState<AppSettings | undefined>(propSettings);

  // Sync state if propSettings changes
  useEffect(() => {
    if (propSettings) {
      setCurrentSettings(propSettings);
    }
  }, [propSettings]);

  // Fetch live settings on mount to guarantee fresh rules
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setCurrentSettings(data.settings);
          }
        }
      } catch (err) {
        console.error("Erreur chargement paramètres :", err);
      }
    }
    loadSettings();
  }, []);

  const euroRatio = currentSettings?.loyalty?.euroToPointsRatio ?? LOYALTY_CONFIG.conversion.euroToPointsRatio;
  const pointValueInEuro = currentSettings?.loyalty?.pointValueInEuro ?? LOYALTY_CONFIG.conversion.pointValueInEuro;
  const tierThresholds = currentSettings?.loyalty
    ? {
        silver: currentSettings.loyalty.tierSilverMinPoints,
        gold: currentSettings.loyalty.tierGoldMinPoints,
        vip: currentSettings.loyalty.tierVipMinPoints,
      }
    : undefined;
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

  // Post-transaction auto-redirect countdown
  const router = useRouter();
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [completedTxAlert, setCompletedTxAlert] = useState<string | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedTxAlertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearRedirectTimers = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleImmediateRedirect = (finalMsg?: string) => {
    clearRedirectTimers();
    setRedirectCountdown(null);
    // Explicitly guarantee that no customer is selected
    setSelectedCustomerId(null);
    setSelectedCustomerDetail(null);
    setSearchQuery("");
    setCustomers([]);
    if (finalMsg) {
      setCompletedTxAlert(finalMsg);
      if (completedTxAlertTimerRef.current) clearTimeout(completedTxAlertTimerRef.current);
      completedTxAlertTimerRef.current = setTimeout(() => {
        setCompletedTxAlert(null);
      }, 5000);
    }
    router.push("/cashier/pos");
  };

  const triggerPostTransactionRedirect = (successMsg: string) => {
    clearRedirectTimers();
    if (completedTxAlertTimerRef.current) clearTimeout(completedTxAlertTimerRef.current);

    // 1. Immediately reset customer and search so the cashier sees the input right away
    setSelectedCustomerId(null);
    setSelectedCustomerDetail(null);
    setSearchQuery("");
    setCustomers([]);
    setIsAddPurchaseOpen(false);
    setIsRedeemOpen(false);

    // 2. Alertify success (toast notification + 5-second banner on caisse view)
    toast.success(successMsg, { duration: 5000 });
    setCompletedTxAlert(successMsg);
    setRedirectCountdown(5);

    let remaining = 5;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCompletedTxAlert(null);
        setRedirectCountdown(null);
      } else {
        setRedirectCountdown(remaining);
      }
    }, 1000);

    completedTxAlertTimerRef.current = setTimeout(() => {
      setCompletedTxAlert(null);
      setRedirectCountdown(null);
    }, 5000);

    router.push("/cashier/pos");
  };

  useEffect(() => {
    return () => {
      clearRedirectTimers();
      if (completedTxAlertTimerRef.current) clearTimeout(completedTxAlertTimerRef.current);
    };
  }, []);

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
      {/* If a customer is selected, show Customer Detail View with points actions */}
      {selectedCustomerId && selectedCustomerDetail ? (
        <div className="space-y-4">
          {redirectCountdown !== null && (
            <div className="p-4 sm:p-5 rounded-[var(--radius-card,16px)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">🎉</span>
                <div>
                  <strong className="block text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Transaction confirmée avec succès !
                  </strong>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Redirection vers l&apos;accueil caisse dans <span className="font-extrabold font-mono text-sm px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-900 dark:text-emerald-100">{redirectCountdown}s</span> pour le prochain client...
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleImmediateRedirect()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              >
                Passer au client suivant
              </Button>
            </div>
          )}
          <CustomerDetailView
            customer={selectedCustomerDetail}
            onBack={() => {
              clearRedirectTimers();
              setRedirectCountdown(null);
              setSelectedCustomerId(null);
              setSelectedCustomerDetail(null);
            }}
            onOpenAddPurchase={() => setIsAddPurchaseOpen(true)}
            onOpenRedeemPoints={() => setIsRedeemOpen(true)}
            pointValueInEuro={pointValueInEuro}
            minPointsToRedeem={currentSettings?.loyalty?.minPointsToRedeem}
            tierThresholds={tierThresholds}
          />
        </div>
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
          {/* Confirmed Transaction Alert (Displayed when redirected with no customer selected) */}
          {completedTxAlert && (
            <div className="p-4 sm:p-5 rounded-[var(--radius-card,16px)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xl select-none">✅</span>
                <div>
                  <strong className="block text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {completedTxAlert}
                  </strong>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Caisse prête pour le client suivant (aucun client sélectionné).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedTxAlert(null)}
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕ Fermer
              </button>
            </div>
          )}

          {/* Search Bar Card */}
          <Card padded="lg" className="space-y-5">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                Caisse &amp; Points de Fidélité
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                Recherchez un client au comptoir par nom, téléphone ou email pour consulter ses points, enregistrer un achat (1 € = {euroRatio} pt{euroRatio > 1 ? "s" : ""}) ou utiliser ses points fidélité.
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
                    🎟️ 1 € dépensé = {euroRatio} point{euroRatio > 1 ? "s" : ""}
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
          toast.success(`Client ${newCust.full_name} créé avec succès !`);
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
        euroToPointsRatio={currentSettings?.loyalty?.euroToPointsRatio}
        quickPurchaseAmounts={currentSettings?.pos?.quickPurchaseAmounts}
        onPurchaseRecorded={(updatedCust) => {
          triggerPostTransactionRedirect(`Achat de ${updatedCust.full_name} enregistré (+ points crédités avec succès) !`);
        }}
      />

      {/* Modal 3: Utiliser des points fidélité (Déduction et contrôle solde) */}
      <RedeemPointsModal
        isOpen={isRedeemOpen}
        customer={selectedCustomerDetail}
        onClose={() => setIsRedeemOpen(false)}
        pointValueInEuro={currentSettings?.loyalty?.pointValueInEuro}
        euroToPointsRatio={currentSettings?.loyalty?.euroToPointsRatio}
        quickPurchaseAmounts={currentSettings?.pos?.quickPurchaseAmounts}
        quickRedeemPoints={currentSettings?.pos?.quickRedeemPoints}
        minPointsToRedeem={currentSettings?.loyalty?.minPointsToRedeem}
        maxDiscountPerTransactionEuro={currentSettings?.loyalty?.maxDiscountPerTransactionEuro}
        defaultRedeemReason={currentSettings?.pos?.defaultRedeemReason}
        onPointsRedeemed={(updatedCust) => {
          triggerPostTransactionRedirect(`Remise et points de ${updatedCust.full_name} déduits avec succès !`);
        }}
        onPurchaseRecorded={(updatedCust) => {
          triggerPostTransactionRedirect(`Achat de ${updatedCust.full_name} enregistré (+ points crédités avec succès) !`);
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
        euroToPointsRatio={euroRatio}
      />
      <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {content}
      </main>
    </div>
  );
}
