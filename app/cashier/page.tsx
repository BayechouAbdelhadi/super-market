import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { CashierDashboard } from '@/components/loyalty/CashierDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "SuperMarket Fidélité — Espace Caisse",
  description: "Système de fidélité et caisse : recherche clients, calcul et déduction de points",
}

export default function CashierPage() {
  return (
    <ProtectedDashboard requiredRole="CASHIER">
      <CashierDashboard standalone={false} />
    </ProtectedDashboard>
  )
}
