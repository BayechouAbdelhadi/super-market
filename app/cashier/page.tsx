import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { CashierDashboard } from '@/components/loyalty/CashierDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "SuperMarket Fidélité — Caisse",
  description: "Recherche client et gestion des points de fidélité au comptoir",
}

export default function CashierPage() {
  return (
    <ProtectedDashboard requiredRole="CASHIER">
      <CashierDashboard standalone={false} />
    </ProtectedDashboard>
  )
}
