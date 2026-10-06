import { createClient } from '@/lib/supabase/server'
import { CustomerWorkspace } from '@/components/loyalty/CustomerWorkspace'

export async function CustomersList() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'CUSTOMER')
    .order('created_at', { ascending: false })

  return <CustomerWorkspace initialCustomers={customers || []} />
}
