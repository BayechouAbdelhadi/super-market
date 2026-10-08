"use client"

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/SearchInput'
import { UserManager } from '@/components/shared/UserManager'
import { CustomerDetailView } from '@/components/loyalty/CustomerDetailView'
import { AddPurchaseModal } from '@/components/loyalty/AddPurchaseModal'
import { RedeemPointsModal } from '@/components/loyalty/RedeemPointsModal'
import { NewCustomerModal } from '@/components/loyalty/NewCustomerModal'
import { CustomerDetail } from '@/lib/loyalty/types'

interface CustomerWorkspaceProps {
  initialCustomers?: any[]
  title?: string
  subtitle?: string
}

export function CustomerWorkspace({
  initialCustomers = [],
  title = "Gestion des Clients",
  subtitle = "Consultez, modifiez et gérez l'ensemble des profils clients de votre magasin."
}: CustomerWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [createdCustomers, setCreatedCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)

  // Modals for loyalty actions from detail view
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false)
  const [isRedeemOpen, setIsRedeemOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr))
    }, 4000)
  }

  function handleCustomerCreated(newCustomer: CustomerDetail) {
    setIsNewCustomerOpen(false)
    showToast(`Client ${newCustomer.full_name} créé avec succès !`)

    const newListItem = {
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

  async function handleViewDetail(user: any) {
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
        .some((field: string) => field.toLowerCase().includes(q))
    )
  }, [allCustomers, searchQuery])

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold text-xs py-3 px-5 rounded-[var(--radius-button,12px)] shadow-lg flex items-center gap-2">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* If a customer detail is opened, show full CustomerDetailView */}
      {selectedCustomerId && selectedCustomerDetail ? (
        <div className="space-y-4">
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedCustomerId(null)
              setSelectedCustomerDetail(null)
            }}
            className="gap-2 text-xs"
          >
            <span>← Retour à la liste des clients</span>
          </Button>

          <CustomerDetailView
            customer={selectedCustomerDetail}
            onBack={() => {
              setSelectedCustomerId(null)
              setSelectedCustomerDetail(null)
            }}
            onOpenAddPurchase={() => setIsAddPurchaseOpen(true)}
            onOpenRedeemPoints={() => setIsRedeemOpen(true)}
          />

          {/* Action Modal 1: Add Purchase */}
          <AddPurchaseModal
            isOpen={isAddPurchaseOpen}
            customer={selectedCustomerDetail}
            onClose={() => setIsAddPurchaseOpen(false)}
            onPurchaseRecorded={(updatedCust) => {
              setSelectedCustomerDetail(updatedCust)
              showToast("Achat enregistré et points crédités avec succès !")
            }}
          />

          {/* Action Modal 2: Redeem Points */}
          <RedeemPointsModal
            isOpen={isRedeemOpen}
            customer={selectedCustomerDetail}
            onClose={() => setIsRedeemOpen(false)}
            onPointsRedeemed={(updatedCust) => {
              setSelectedCustomerDetail(updatedCust)
              showToast("Achat enregistré et points déduits avec succès !")
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
                  : "Gérez les profils clients, consultez leur solde de fidélité ou créez un nouveau profil."
              }
              onViewDetail={handleViewDetail}
              onAddCustomer={() => setIsNewCustomerOpen(true)}
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
