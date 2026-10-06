import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { UserManager } from '@/components/shared/UserManager'

export async function CashiersList() {
  const supabase = await createClient()
  const { data: cashiers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'CASHIER')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Gestion des Caissiers</h2>
        <p className="text-[var(--color-text-muted)]">Gérez les accès et les comptes des caissiers.</p>
      </div>

      <Card className="p-6">
        <UserManager 
          initialUsers={cashiers || []} 
          roleToManage="CASHIER" 
          title="Gestion des Caissiers" 
          description="Ajoutez ou modifiez les profils des caissiers de votre établissement." 
        />
      </Card>
    </div>
  )
}
