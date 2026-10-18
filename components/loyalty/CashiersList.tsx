import { SupabaseDirectoryRepository } from '@/lib/loyalty/adapters/supabase-directory-repository'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import { Card } from '@/components/ui/card'
import { UserManager } from '@/components/shared/UserManager'

const directory = new SupabaseDirectoryRepository()

export async function CashiersList() {
  const cashiers = await directory.listRecentProfilesByRole('CASHIER', LOYALTY_CONFIG.pagination.backOfficeListLimit)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Gestion des Caissiers</h2>
        <p className="text-[var(--color-text-muted)]">Gérez les accès et les comptes des caissiers.</p>
      </div>

      <Card className="p-6">
        <UserManager 
          initialUsers={cashiers} 
          roleToManage="CASHIER" 
          title="Gestion des Caissiers" 
          description="Ajoutez ou modifiez les profils des caissiers de votre établissement." 
        />
      </Card>
    </div>
  )
}
