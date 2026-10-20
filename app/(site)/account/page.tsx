import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Clock, Mail, MapPin, Phone, Sparkles, Tag, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveUserRole } from '@/lib/auth/roles'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/components/loyalty/StatusBadge'
import { getAppSettings } from '@/lib/settings/service'
import { SupabaseSelfProfileRepository } from '@/lib/account/adapters/supabase-self-profile-repository'
import { resolveDisplayIdentity } from '@/lib/account/identity'
import { groupWeek } from '@/lib/store/opening-hours'
import { formatPhone } from '@/lib/store/contact'

export const metadata: Metadata = { title: 'Mon espace' }

export default async function AccountHubPage() {
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

  // Fetch customer profile, loyalty info, and app settings
  const selfProfile = new SupabaseSelfProfileRepository(supabase)
  const [profile, loyalty, settings] = await Promise.all([
    selfProfile.getProfile(user.id),
    selfProfile.getLoyalty(user.id),
    getAppSettings(),
  ])

  const identity = resolveDisplayIdentity(profile, user)
  const { firstName, email, phone } = identity
  const fullName = identity.fullName || user.email || 'Client'
  const points = loyalty?.points ?? 0
  const tier = loyalty?.tier ?? LOYALTY_CONFIG.defaults.tier
  const pointValueInEuro = settings.loyalty.pointValueInEuro
  const euroDiscount = (points * pointValueInEuro).toFixed(2)


  const profileRows = [
    { icon: User, label: 'Nom', value: fullName },
    { icon: Phone, label: 'Téléphone', value: phone ? formatPhone(phone) : 'Non renseigné' },
    { icon: Mail, label: 'Email', value: email },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-10 sm:px-6 md:py-14">
      {/* Greeting + balance */}
      <section className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary-ink">Mon espace</p>
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Bonjour {firstName || fullName}</h1>
          <p className="text-lg text-text-muted">Retrouvez vos points, vos avantages et vos informations.</p>
        </div>
        <Card padded="md" className="gap-1 md:min-w-72">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-text-muted">Solde disponible</span>
            <StatusBadge status={tier} size="sm" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-text tabular-nums">
            {points} <span className="text-lg font-semibold text-text-muted">pts</span>
          </p>
          <p className="text-sm text-text-muted">soit {euroDiscount} € de remise en caisse</p>
        </Card>
      </section>

      {/* Services */}
      <section aria-labelledby="services-title" className="space-y-5">
        <h2 id="services-title" className="text-2xl font-bold tracking-tight text-text">
          Vos services
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/account/loyalty" className="group rounded-[var(--radius-card)]">
            <Card interactive padded="lg" className="h-full gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-button)] bg-surface-hover text-primary">
                  <Sparkles aria-hidden className="h-6 w-6" />
                </span>
                <Badge variant="success" size="sm">Actif</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-text">Programme fidélité</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  Votre solde de points, votre statut et l&apos;historique de vos passages en caisse.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary-ink">
                Voir mon espace fidélité
                <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Card>
          </Link>

          <Card padded="lg" className="h-full gap-4 bg-surface-hover shadow-none">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-button)] bg-surface text-text-muted">
                <Tag aria-hidden className="h-6 w-6" />
              </span>
              <Badge variant="neutral" size="sm">Bientôt</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-text">Catalogues &amp; bons plans</h3>
              <p className="text-sm leading-relaxed text-text-muted">
                Les arrivages de la semaine et les réductions réservées aux membres.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Profile + store */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card padded="lg" className="gap-5 md:col-span-2">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-text">Mes informations</h2>
            <p className="text-sm text-text-muted">Elles permettent au caissier de vous retrouver.</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
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

        <Card padded="lg" className="gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-text">Mon magasin</h2>
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
              <div>
                <p className="font-medium text-text">{settings.store.storeName}</p>
                <p className="text-text-muted">{settings.store.address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
              <dl className="space-y-1">
                {groupWeek(settings.hours.weekly).map((group) => (
                  <div key={group.days}>
                    <dt className="inline font-medium text-text">{group.days} : </dt>
                    <dd className="inline tabular-nums text-text-muted">{group.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <Link href="/#infos" className={buttonVariants({ variant: 'secondary', className: 'mt-auto' })}>
            Infos pratiques
          </Link>
        </Card>
      </section>
    </main>
  )
}
