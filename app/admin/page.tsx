import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { StatCard } from '@/components/ui/StatCard'

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
      </div>
    </DashboardLayout>
  )
}
