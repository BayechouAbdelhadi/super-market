import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveUserRole } from '@/lib/auth/roles'
import { ARRIVALS_CONFIG } from '@/lib/arrivals/config'
import { isArrivalsCustomerEnabled } from '@/lib/arrivals/flags'
import { listCustomerReservations } from '@/lib/arrivals/service'
import type { ReservationPage } from '@/lib/arrivals/types'
import { ArrivalsComingSoon } from '@/components/arrivals/ArrivalsComingSoon'
import { CustomerReservationsList } from '@/components/arrivals/CustomerReservationsList'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/config'

export const metadata: Metadata = { title: 'Mes réservations', robots: PRIVATE_PAGE_ROBOTS }

export default async function CustomerReservationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/account/reservations')
  }

  const role = await resolveUserRole(supabase, user)
  if (role === 'ADMIN') redirect('/admin')
  if (role === 'CASHIER') redirect('/cashier')

  const enabled = isArrivalsCustomerEnabled()
  let initial: ReservationPage = { items: [], total: 0 }
  let loadFailed = false
  if (enabled) {
    try {
      initial = await listCustomerReservations(user.id, 0, ARRIVALS_CONFIG.customerReservationsPageSize)
    } catch (err) {
      console.error('[CustomerReservationsPage] Failed to load reservations:', err)
      loadFailed = true
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6 md:py-14">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Mes réservations</h1>
        <p className="text-base text-text-muted">
          Le jour du retrait, présentez votre carte du magasin en caisse : votre réservation s&apos;affiche.
        </p>
      </div>
      {enabled ? (
        <CustomerReservationsList
          initialReservations={initial.items}
          initialTotal={initial.total}
          loadFailed={loadFailed}
        />
      ) : (
        <ArrivalsComingSoon
          title="La réservation d'arrivages arrive"
          description="Vos réservations d'arrivages s'afficheront ici dès l'ouverture du service."
        />
      )}
    </main>
  )
}
