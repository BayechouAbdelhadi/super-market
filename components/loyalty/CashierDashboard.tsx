"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { CustomerDetail, CustomerSummary } from "@/lib/loyalty/types";
import { SearchBar } from "./SearchBar";
import { CustomerCard } from "./CustomerCard";
import { CustomerDetailView } from "./CustomerDetailView";
import { NewCustomerModal } from "./NewCustomerModal";
import { AddPurchaseModal } from "./AddPurchaseModal";
import { RedeemPointsModal } from "./RedeemPointsModal";
import { CardScannerModal } from "./CardScannerModal";
import { unlockScanBeep } from "@/lib/loyalty/scan-beep";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import { AppSettings } from "@/lib/settings/types";
import { toast } from "@/components/ui/sonner";

interface SearchResults {
  query: string;
  customers: CustomerSummary[];
}

const NO_RESULTS: SearchResults = { query: "", customers: [] };

export interface CashierDashboardProps {
  settings?: AppSettings;
  /** Customer reopened on arrival (e.g. back from a transaction edit) */
  initialCustomerId?: string;
}

export function CashierDashboard({ settings: propSettings, initialCustomerId }: CashierDashboardProps) {
  const [currentSettings, setCurrentSettings] = useState<AppSettings | undefined>(propSettings);

  // New settings from the server replace the current ones (adjusted during render, not in an effect)
  const [previousPropSettings, setPreviousPropSettings] = useState(propSettings);
  if (propSettings !== previousPropSettings) {
    setPreviousPropSettings(propSettings);
    if (propSettings) setCurrentSettings(propSettings);
  }

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

  const pointValueInEuro = currentSettings?.loyalty?.pointValueInEuro ?? LOYALTY_CONFIG.conversion.pointValueInEuro;
  const tierThresholds = currentSettings?.loyalty
    ? {
        silver: currentSettings.loyalty.tierSilverMinPoints,
        gold: currentSettings.loyalty.tierGoldMinPoints,
        vip: currentSettings.loyalty.tierVipMinPoints,
      }
    : undefined;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, LOYALTY_CONFIG.search.debounceMs);
  // Search results, tagged with the query they answer: `loading` is "results do not match the query yet"
  const [results, setResults] = useState<SearchResults>(NO_RESULTS);
  const searchedQuery = debouncedSearchQuery.trim();
  const customers = searchedQuery && results.query === searchedQuery ? results.customers : NO_RESULTS.customers;
  const loading = searchedQuery !== "" && results.query !== searchedQuery;
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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
    setResults(NO_RESULTS);
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
    setResults(NO_RESULTS);
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

  // Search effect: executes ONLY when debouncedSearchQuery changes with AbortController
  useEffect(() => {
    const trimmed = debouncedSearchQuery.trim();
    if (!trimmed) return;

    const abortController = new AbortController();

    async function fetchCustomers() {
      try {
        const res = await fetch(
          `/api/loyalty/customers?q=${encodeURIComponent(trimmed)}`,
          { signal: abortController.signal }
        );
        const data = res.ok ? await res.json() : null;
        startTransition(() => {
          setResults({ query: trimmed, customers: data?.customers ?? [] });
        });
      } catch (err) {
        if (!(err instanceof Error && err.name === "AbortError")) {
          console.error("Erreur recherche clients :", err);
          // Ends the loading state for this query
          setResults({ query: trimmed, customers: [] });
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
      } else {
        setSelectedCustomerId(null);
        toast.error(res.status === 404 ? "Carte non reconnue : client introuvable." : data.message || "Impossible de charger le client.");
      }
    } catch (err) {
      console.error("Erreur chargement détail client :", err);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Reopens the customer named in the URL once, on arrival
  const initialCustomerLoaded = useRef(false);
  useEffect(() => {
    if (!initialCustomerId || initialCustomerLoaded.current) return;
    initialCustomerLoaded.current = true;
    loadCustomerDetail(initialCustomerId);
  }, [initialCustomerId]);

  const content = (
    <div className="space-y-6">
      {/* If a customer is selected, show Customer Detail View with points actions */}
      {selectedCustomerId && selectedCustomerDetail ? (
        <div className="space-y-4">
          {redirectCountdown !== null && (
            <div className="p-4 sm:p-5 rounded-[var(--radius-card,16px)] bg-success-subtle border border-success-border text-success-text flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">🎉</span>
                <div>
                  <strong className="block text-sm font-bold text-success-text">
                    Transaction confirmée avec succès !
                  </strong>
                  <p className="text-xs text-success-text">
                    Redirection vers l&apos;accueil caisse dans <span className="font-extrabold font-mono text-sm px-1.5 py-0.5 rounded bg-success-subtle text-success-text">{redirectCountdown}s</span> pour le prochain client...
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleImmediateRedirect()}
                className="bg-success hover:bg-success/90 text-on-color shrink-0"
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
            <div className="p-4 sm:p-5 rounded-[var(--radius-card,16px)] bg-success-subtle border border-success-border text-success-text flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xl select-none">✅</span>
                <div>
                  <strong className="block text-sm font-bold text-success-text">
                    {completedTxAlert}
                  </strong>
                  <p className="text-xs text-success-text">
                    Caisse prête pour le client suivant (aucun client sélectionné).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedTxAlert(null)}
                className="text-success-text hover:text-success-text hover:bg-success-subtle text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕ Fermer
              </button>
            </div>
          )}

          <SearchBar
            query={searchQuery}
            onChange={setSearchQuery}
            loading={loading || (searchQuery.trim() !== "" && searchQuery !== debouncedSearchQuery)}
            onOpenNewCustomer={() => setIsNewCustomerOpen(true)}
            onOpenScanner={() => {
              unlockScanBeep();
              setIsScannerOpen(true);
            }}
          />

          {/* Results Section */}
          <div className="space-y-3">
            {searchQuery.trim() === "" ? (
              <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                Recherchez un client pour commencer.
              </p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-[var(--radius-card,16px)] bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse overflow-hidden"
                      >
                        <div className="px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                          <div className="h-5 w-14 bg-[var(--color-border)]/60 rounded-full" />
                        </div>
                        <div className="px-3 py-2 space-y-2">
                          <div className="h-4 w-32 bg-[var(--color-border)]/80 rounded-md" />
                          <div className="h-3 w-24 bg-[var(--color-border)]/50 rounded-md" />
                          <div className="h-3 w-40 bg-[var(--color-border)]/50 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : customers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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

      {/* Loyalty card scan: opens the scanned customer */}
      <CardScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCustomerScanned={(customerId) => {
          setIsScannerOpen(false);
          loadCustomerDetail(customerId);
        }}
      />

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

  return content;
}
