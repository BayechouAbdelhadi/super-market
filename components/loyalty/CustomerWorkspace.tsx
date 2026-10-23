"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/SearchInput'
import { UserManager } from '@/components/shared/UserManager'
import { CustomerDetailView } from '@/components/loyalty/CustomerDetailView'
import { AddPurchaseModal } from '@/components/loyalty/AddPurchaseModal'
import { RedeemPointsModal } from '@/components/loyalty/RedeemPointsModal'
import { NewCustomerModal } from '@/components/loyalty/NewCustomerModal'
import { CustomerDetail, DirectoryUser } from '@/lib/loyalty/types'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import { AppSettings } from '@/lib/settings/types'
import { toast } from '@/components/ui/sonner'

interface CustomerWorkspaceProps {
  initialCustomers?: DirectoryUser[]
  title?: string
  subtitle?: string
  initialPage?: number
  initialLimit?: number
  initialQuery?: string
  settings?: AppSettings
  canToggleStatus?: boolean
}

export function CustomerWorkspace({
  initialCustomers = [],
  title = "Gestion des Clients",
  subtitle = "Consultez, modifiez et gérez l'ensemble des profils clients de votre magasin.",
  initialLimit,
  initialQuery = "",
  settings: propSettings,
  canToggleStatus,
}: CustomerWorkspaceProps) {
  const [currentSettings, setCurrentSettings] = useState<AppSettings | undefined>(propSettings);

  // New settings from the server replace the current ones (adjusted during render, not in an effect)
  const [previousPropSettings, setPreviousPropSettings] = useState(propSettings);
  if (propSettings !== previousPropSettings) {
    setPreviousPropSettings(propSettings);
    if (propSettings) setCurrentSettings(propSettings);
  }

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
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [createdCustomers, setCreatedCustomers] = useState<DirectoryUser[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)

  // Modals for loyalty actions from detail view
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false)
  const [isRedeemOpen, setIsRedeemOpen] = useState(false)

  // Auto-redirect countdown to caisse
  const router = useRouter()
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearRedirectTimers = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }

  const handleImmediateRedirect = () => {
    clearRedirectTimers()
    setRedirectCountdown(null)
    setSelectedCustomerId(null)
    setSelectedCustomerDetail(null)
    router.push('/cashier/pos')
  }

  const triggerPostTransactionRedirect = (successMsg: string) => {
    clearRedirectTimers()
    // Immediately reset customer selection and navigate to caisse
    setSelectedCustomerId(null)
    setSelectedCustomerDetail(null)
    setSearchQuery('')
    setIsAddPurchaseOpen(false)
    setIsRedeemOpen(false)

    toast.success(successMsg, { duration: 5000 })
    router.push('/cashier/pos')
  }

  useEffect(() => {
    return () => {
      clearRedirectTimers()
    }
  }, [])

  function handleCustomerCreated(newCustomer: CustomerDetail) {
    setIsNewCustomerOpen(false)
    toast.success(`Client ${newCustomer.full_name} créé avec succès !`)

    const newListItem: DirectoryUser = {
      id: newCustomer.id,
      first_name: newCustomer.first_name,
      last_name: newCustomer.last_name,
      email: newCustomer.email,
      phone_number: newCustomer.phone,
      role: 'CUSTOMER',
      created_at: newCustomer.created_at,
      loyalty_points: newCustomer.available_points,
      status: newCustomer.tier,
    }
    setCreatedCustomers((prev) => [newListItem, ...prev.filter((c) => c.id !== newCustomer.id)])

    // Open detail immediately
    setSelectedCustomerId(newCustomer.id)
    setSelectedCustomerDetail(newCustomer)
  }

  async function handleViewDetail(user: { id: string }) {
    setSelectedCustomerId(user.id)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/loyalty/customers/${user.id}`)
      const data = await res.json()
      if (data.customer) {
        setSelectedCustomerDetail(data.customer)
      }
    } catch (err) {
      console.error("Erreur chargement détails client :", err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const allCustomers = useMemo(() => {
    const createdIds = new Set(createdCustomers.map((c) => c.id))
    return [...createdCustomers, ...initialCustomers.filter((c) => !createdIds.has(c.id))]
  }, [createdCustomers, initialCustomers])

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return allCustomers
    return allCustomers.filter((c) =>
      [c.first_name, c.last_name, c.email, c.phone_number]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    )
  }, [allCustomers, searchQuery])

  return (
    <div className="space-y-6">
      {/* If a customer detail is opened, show full CustomerDetailView */}
      {selectedCustomerId && selectedCustomerDetail ? (
        <div className="space-y-4">
          <Button
            variant="secondary"
            onClick={() => {
              clearRedirectTimers()
              setRedirectCountdown(null)
              setSelectedCustomerId(null)
              setSelectedCustomerDetail(null)
            }}
            className="gap-2 text-xs"
          >
            <span>← Retour à la liste des clients</span>
          </Button>

          {redirectCountdown !== null && (
            <div className="p-4 sm:p-5 rounded-[var(--radius-card,16px)] bg-success-subtle border border-success-border text-success-text flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">🎉</span>
                <div>
                  <strong className="block text-sm font-bold text-success-text">
                    Transaction confirmée avec succès !
                  </strong>
                  <p className="text-xs text-success-text">
                    Redirection vers l&apos;accueil caisse dans <span className="font-extrabold font-mono text-sm px-1.5 py-0.5 rounded bg-success-subtle text-success-text">{redirectCountdown}s</span>...
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleImmediateRedirect}
                className="bg-success hover:bg-success/90 text-on-color shrink-0"
              >
                Aller à la caisse maintenant
              </Button>
            </div>
          )}

          <CustomerDetailView
            customer={selectedCustomerDetail}
            onBack={() => {
              clearRedirectTimers()
              setRedirectCountdown(null)
              setSelectedCustomerId(null)
              setSelectedCustomerDetail(null)
            }}
            onOpenAddPurchase={() => setIsAddPurchaseOpen(true)}
            onOpenRedeemPoints={() => setIsRedeemOpen(true)}
            pointValueInEuro={pointValueInEuro}
            minPointsToRedeem={currentSettings?.loyalty?.minPointsToRedeem}
            tierThresholds={tierThresholds}
          />

          {/* Action Modal 1: Add Purchase */}
          <AddPurchaseModal
            isOpen={isAddPurchaseOpen}
            customer={selectedCustomerDetail}
            onClose={() => setIsAddPurchaseOpen(false)}
            euroToPointsRatio={currentSettings?.loyalty?.euroToPointsRatio}
            quickPurchaseAmounts={currentSettings?.pos?.quickPurchaseAmounts}
            onPurchaseRecorded={(updatedCust) => {
              triggerPostTransactionRedirect(`Achat de ${updatedCust.full_name} enregistré (+ points crédités avec succès) !`)
            }}
          />

          {/* Action Modal 2: Redeem Points */}
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
              triggerPostTransactionRedirect(`Remise et points de ${updatedCust.full_name} déduits avec succès !`)
            }}
            onPurchaseRecorded={(updatedCust) => {
              triggerPostTransactionRedirect(`Achat de ${updatedCust.full_name} enregistré (+ points crédités avec succès) !`)
            }}
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
        /* Standard Customer Management List View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">{title}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsNewCustomerOpen(true)}
              className="gap-2 shrink-0 font-semibold shadow-sm"
            >
              <span>+</span>
              <span>Nouveau client</span>
            </Button>
          </div>

          <div className="w-full">
            <SearchInput
              placeholder="Nom, prénom, téléphone ou email..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          <Card className="p-6">
            <UserManager
              initialUsers={filteredCustomers}
              roleToManage="CUSTOMER"
              title="Nouveau Client"
              description={
                searchQuery
                  ? `${filteredCustomers.length} résultat(s) pour « ${searchQuery} »`
                  : `${filteredCustomers.length} profil(s) client(s) au total dans votre établissement.`
              }
              onViewDetail={handleViewDetail}
              onAddCustomer={() => setIsNewCustomerOpen(true)}
              defaultPageSize={initialLimit || LOYALTY_CONFIG.pagination.tablePageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              alwaysShowPagination={true}
              canToggleStatus={canToggleStatus}
            />
          </Card>
        </div>
      )}

      {/* Unified Customer Creation Modal (Same as Caisse) */}
      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onCustomerCreated={handleCustomerCreated}
        onOpenExisting={(existingCustomer) => {
          setIsNewCustomerOpen(false)
          handleViewDetail(existingCustomer)
        }}
      />
    </div>
  )
}
