import { createClient } from '@/lib/supabase/server'
import { CustomerWorkspace } from '@/components/loyalty/CustomerWorkspace'

interface CustomersListProps {
  title?: string
  subtitle?: string
}

export async function CustomersList({ title, subtitle }: CustomersListProps = {}) {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id, first_name, last_name, email, phone_number, created_at, role,
      customers ( loyalty_points, status )
    `)
    .eq('role', 'CUSTOMER')
    .order('created_at', { ascending: false })

  const customers = (profiles || []).map((p: any) => {
    const cust = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      ...p,
      loyalty_points: cust?.loyalty_points ?? 0,
      status: cust?.status ?? 'BRONZE',
    };
  });

  return <CustomerWorkspace initialCustomers={customers} title={title} subtitle={subtitle} />
}
