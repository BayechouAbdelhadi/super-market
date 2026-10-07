import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { redirect } from 'next/navigation'

export async function ProtectedDashboard({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode, 
  requiredRole?: 'ADMIN' | 'CASHIER' | 'CUSTOMER' 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role || 'CUSTOMER'

  // Admin can access everything, Cashiers can access CASHIER and CUSTOMER, Customers can access CUSTOMER
  if (requiredRole === 'ADMIN' && role !== 'ADMIN') {
    redirect('/cashier') // Fallback to their own dashboard
  }

  if (requiredRole === 'CASHIER' && role !== 'CASHIER' && role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <DashboardLayout role={role} email={user.email || ''}>
      {children}
    </DashboardLayout>
  )
}
