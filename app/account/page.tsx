import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role || 'CUSTOMER'
  if (role === 'ADMIN') {
    redirect('/admin')
  }
  if (role === 'CASHIER') {
    redirect('/cashier')
  }

  redirect('/login')
}
