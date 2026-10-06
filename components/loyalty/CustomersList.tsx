import { createClient } from '@/lib/supabase/server'
import { CustomerWorkspace } from '@/components/loyalty/CustomerWorkspace'

interface CustomersListProps {
  title?: string
  subtitle?: string
}

export async function CustomersList({ title, subtitle }: CustomersListProps = {}) {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'CUSTOMER')
    .order('created_at', { ascending: false })

  return <CustomerWorkspace initialCustomers={customers || []} title={title} subtitle={subtitle} />
}
