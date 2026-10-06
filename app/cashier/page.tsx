import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { CustomersList } from '@/components/loyalty/CustomersList'

export default function CashierDashboard() {
  return (
    <ProtectedDashboard requiredRole="CASHIER">
      <CustomersList />
    </ProtectedDashboard>
  )
}
