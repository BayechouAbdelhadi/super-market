import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/button'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role || 'CUSTOMER'

  // Fetch some mock/real stats for the admin
  const { count: customersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'CUSTOMER')

  return (
    <DashboardLayout role={role} email={user?.email || ''}>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Tableau de bord</h2>
          <p className="text-[var(--color-text-muted)]">Vue d'ensemble de l'activité du magasin.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Clients"
            value={customersCount?.toString() || "0"}
            trend="+12%"
            trendDirection="up"
          />
          <StatCard
            label="Chiffre d'Affaires"
            value="12 450 €"
            trend="+5.2%"
            trendDirection="up"
          />
          <StatCard
            label="Points Distribués"
            value="12,450"
          />
        </div>

        {/* Quick Access to Cashier Space for Admin */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card,16px)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h3 className="text-lg font-bold text-[var(--color-text)]">Accès Espace Caisse</h3>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xl">
              En tant qu'administrateur, vous disposez également d'un accès complet à l'espace caisse pour enregistrer des achats, attribuer des points et gérer les clients au comptoir.
            </p>
          </div>
          <Link href="/cashier">
            <Button variant="primary" size="md" className="shrink-0">
              Ouvrir la caisse →
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
