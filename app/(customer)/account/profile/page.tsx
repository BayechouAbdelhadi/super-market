import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Mail, Phone, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveUserRole } from '@/lib/auth/roles'
import { Card } from '@/components/ui/card'
import { SupabaseSelfProfileRepository } from '@/lib/account/adapters/supabase-self-profile-repository'
import { resolveDisplayIdentity } from '@/lib/account/identity'
import { formatPhone } from '@/lib/store/contact'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/config'

export const metadata: Metadata = { title: 'Mon profil', robots: PRIVATE_PAGE_ROBOTS }

export default async function CustomerProfilePage() {
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

  const profile = await new SupabaseSelfProfileRepository(supabase).getProfile(user.id)
  const identity = resolveDisplayIdentity(profile, user)
  const { email, phone } = identity
  const fullName = identity.fullName || user.email || 'Client'

  const profileRows = [
    { icon: User, label: 'Nom', value: fullName },
    { icon: Phone, label: 'Téléphone', value: phone ? formatPhone(phone) : 'Non renseigné' },
    { icon: Mail, label: 'Email', value: email },
  ]

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6 md:py-14">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Mon profil</h1>
        <p className="text-lg text-text-muted">Ces informations permettent au caissier de vous retrouver.</p>
      </div>

      <Card padded="lg" className="gap-5">
        <dl className="space-y-5">
          {profileRows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="min-w-0 space-y-1">
              <dt className="flex items-center gap-1.5 text-sm text-text-muted">
                <Icon aria-hidden className="h-4 w-4" />
                {label}
              </dt>
              <dd className="truncate text-base font-medium text-text" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-border pt-4 text-sm text-text-muted">
          Pour modifier ces informations, adressez-vous à l&apos;accueil du magasin.
        </p>
      </Card>
    </main>
  )
}
