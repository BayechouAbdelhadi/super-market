import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Receipt, Store, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveUserRole } from '@/lib/auth/roles'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/loyalty/StatusBadge'
import { DigitalLoyaltyCard } from '@/components/loyalty/DigitalLoyaltyCard'
import { LoyaltyCardQrButton } from '@/components/loyalty/LoyaltyCardQrButton'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import { getAppSettings } from '@/lib/settings/service'
import { SupabaseSelfProfileRepository } from '@/lib/account/adapters/supabase-self-profile-repository'
import { resolveDisplayIdentity } from '@/lib/account/identity'
import { formatPhone } from '@/lib/store/contact'

export const metadata: Metadata = { title: 'Mon espace fidélité', robots: PRIVATE_PAGE_ROBOTS };
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

export default async function CustomerLoyaltyAppPage() {
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

  // Fetch profile, customer loyalty status, recent transactions, and app settings
  const selfProfile = new SupabaseSelfProfileRepository(supabase)
  const [profile, loyalty, transactions, settings] = await Promise.all([
    selfProfile.getProfile(user.id),
    selfProfile.getLoyalty(user.id),
    selfProfile.listRecentTransactions(user.id, LOYALTY_CONFIG.pagination.selfRecentTransactions),
    getAppSettings(),
  ])

  const identity = resolveDisplayIdentity(profile, user)
  const { phone, email } = identity
  const fullName = identity.fullName || user.email || 'Client'
  const points = loyalty?.points ?? 0
  const tier = loyalty?.tier ?? LOYALTY_CONFIG.defaults.tier

  // Dynamic conversion based on admin configured point value
  const pointValueInEuro = settings.loyalty.pointValueInEuro
  const euroDiscount = (points * pointValueInEuro).toFixed(2)

  // Calculate next tier progress with admin configured tier thresholds
  const tiersList = [
    { name: 'BRONZE', min: 0 },
    { name: 'SILVER', min: settings.loyalty.tierSilverMinPoints },
    { name: 'GOLD', min: settings.loyalty.tierGoldMinPoints },
    { name: 'VIP', min: settings.loyalty.tierVipMinPoints },
  ]
  const currentTierIndex = tiersList.findIndex((t) => t.name === tier)
  const nextTier =
    currentTierIndex < tiersList.length - 1 ? tiersList[currentTierIndex + 1] : null
  const pointsToNext = nextTier ? Math.max(0, nextTier.min - points) : 0
  const progressPercent = nextTier
    ? Math.min(100, Math.round((points / nextTier.min) * 100))
    : 100

  const ratio = settings.loyalty.euroToPointsRatio

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-10 sm:px-6 md:py-14">
      <div className="space-y-4">
        <Link
          href="/account"
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] px-2 text-sm font-medium text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Mon espace
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Mon espace fidélité</h1>
          <StatusBadge status={tier} size="lg" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balance */}
        <Card padded="lg" className="gap-8 lg:col-span-2">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-text-muted">Solde disponible</p>
              <p className="text-5xl font-bold tracking-tight text-text tabular-nums">
                {points.toLocaleString('fr-FR')}{' '}
                <span className="text-xl font-semibold text-text-muted">points</span>
              </p>
              <p className="text-base text-text-muted">
                soit <strong className="font-semibold text-text">{euroDiscount} €</strong> de remise en caisse
              </p>
            </div>
            <dl className="space-y-1 text-sm text-text-muted sm:text-right">
              <div>
                <dt className="inline">1 € d&apos;achat = </dt>
                <dd className="inline font-medium text-text">
                  {ratio} point{ratio > 1 ? 's' : ''}
                </dd>
              </div>
              <div>
                <dt className="inline">100 points = </dt>
                <dd className="inline font-medium text-text">{(100 * pointValueInEuro).toFixed(2)} € de remise</dd>
              </div>
            </dl>
          </div>

          {nextTier ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-text">
                  <TrendingUp aria-hidden className="h-4 w-4 text-primary" />
                  Prochain statut : {nextTier.name}
                </span>
                <span className="text-text-muted">
                  encore <strong className="font-semibold text-text">{pointsToNext} points</strong>
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progression vers le statut ${nextTier.name}`}
                className="h-2.5 w-full overflow-hidden rounded-full bg-surface-hover"
              >
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          ) : (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-success-text">
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              Vous avez atteint le statut VIP, le plus élevé.
            </p>
          )}

          <div className="flex gap-4 rounded-[var(--radius-button)] bg-surface-hover p-4">
            <Store aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-text">Utiliser vos points</p>
              <p className="text-sm leading-relaxed text-text-muted">
                En caisse, donnez votre nom ou votre numéro de téléphone
                {phone ? (
                  <>
                    {' '}(<strong className="font-medium text-text">{formatPhone(phone)}</strong>)
                  </>
                ) : null}
                . Le caissier déduit la remise directement de votre ticket.
              </p>
            </div>
          </div>
        </Card>

        {/* Digital card */}
        <div className="space-y-4">
          <DigitalLoyaltyCard
            fullName={fullName}
            phone={phone}
            email={email}
            points={points}
            tier={tier}
            userId={user.id}
            createdAt={user.created_at}
            pointValueInEuro={pointValueInEuro}
          />
          <LoyaltyCardQrButton customerId={user.id} fullName={fullName} />
        </div>
      </div>

      {/* History */}
      <section aria-labelledby="history-title" className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="history-title" className="text-2xl font-bold tracking-tight text-text">
            Dernières opérations
          </h2>
          {transactions && transactions.length > 0 && (
            <span className="text-sm text-text-muted">
              {transactions.length} opération{transactions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <Card padded={false}>
          {transactions && transactions.length > 0 ? (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => {
                const isEarn = (tx.points_earned || 0) > 0
                const isRedeem = (tx.points_redeemed || 0) > 0
                const redeemEuro = ((Number(tx.points_redeemed) || 0) * pointValueInEuro).toFixed(2)
                const txDate = new Date(tx.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <li key={tx.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <p className="text-base font-medium text-text">
                        {isEarn && `Achat de ${(Number(tx.amount_total) || 0).toFixed(2)} €`}
                        {isRedeem && !isEarn && `Remise fidélité de ${redeemEuro} €`}
                      </p>
                      <p className="text-sm text-text-muted">{txDate}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isEarn && (
                        <span className="rounded-full bg-success-subtle px-3 py-1 text-sm font-semibold text-success-text tabular-nums">
                          +{tx.points_earned} pts
                        </span>
                      )}
                      {isRedeem && (
                        <span className="rounded-full bg-surface-hover px-3 py-1 text-sm font-semibold text-text tabular-nums">
                          −{tx.points_redeemed} pts · −{redeemEuro} €
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="space-y-2 px-6 py-12 text-center">
              <Receipt aria-hidden className="mx-auto h-8 w-8 text-text-muted" />
              <p className="text-base font-semibold text-text">Aucune opération pour le moment</p>
              <p className="text-sm text-text-muted">
                Vos achats et vos remises apparaîtront ici après votre prochain passage en caisse.
              </p>
            </div>
          )}
        </Card>
      </section>
    </main>
  )
}
