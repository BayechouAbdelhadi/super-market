import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CalendarCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveUserRole } from '@/lib/auth/roles'
import { Card } from '@/components/ui/card'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/config'

export const metadata: Metadata = { title: 'Mes réservations', robots: PRIVATE_PAGE_ROBOTS }

/** Placeholder: reservations are not available yet, the page only shows an empty state. */
export default async function CustomerReservationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = await resolveUserRole(supabase, user)
  if (role === 'ADMIN') redirect('/admin')
  if (role === 'CASHIER') redirect('/cashier')

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Mes réservations</h1>

      <Card padded="lg" className="items-center gap-2 py-12 text-center">
        <CalendarCheck aria-hidden className="h-8 w-8 text-text-muted" />
        <p className="text-base font-semibold text-text">Aucune réservation pour le moment</p>
        <p className="text-sm text-text-muted">Vos réservations apparaîtront ici.</p>
      </Card>
    </main>
  )
}
