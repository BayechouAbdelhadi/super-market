import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { CashiersList } from '@/components/loyalty/CashiersList'

export default function AdminCashiersPage() {
  return (
    <ProtectedDashboard requiredRole="ADMIN">
      <CashiersList />
    </ProtectedDashboard>
  )
}
