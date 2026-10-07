import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { CustomersList } from '@/components/loyalty/CustomersList'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "SuperMarket — Gestion des Clients",
  description: "Gestion et CRUD des profils clients de votre magasin",
}

export default function CustomersPage() {
  return (
    <ProtectedDashboard requiredRole="CASHIER">
      <CustomersList 
        title="Gestion des Clients"
        subtitle="Consultez, modifiez et gérez l'ensemble des profils clients de votre magasin."
      />
    </ProtectedDashboard>
  )
}
