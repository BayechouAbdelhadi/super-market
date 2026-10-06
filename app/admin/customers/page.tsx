import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { CustomersList } from '@/components/loyalty/CustomersList'

export default function AdminCustomersPage() {
  return (
    <ProtectedDashboard requiredRole="ADMIN">
      <CustomersList 
        title="Gestion des Clients"
        subtitle="Consultez, modifiez et gérez l'ensemble des profils clients de votre magasin."
      />
    </ProtectedDashboard>
  )
}
