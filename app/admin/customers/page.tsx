import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { CustomersList } from '@/components/loyalty/CustomersList'

export default function AdminCustomersPage() {
  return (
    <ProtectedDashboard requiredRole="ADMIN">
      <CustomersList />
    </ProtectedDashboard>
  )
}
