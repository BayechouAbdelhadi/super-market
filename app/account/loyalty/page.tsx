import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/loyalty/StatusBadge'
import { DigitalLoyaltyCard } from '@/components/loyalty/DigitalLoyaltyCard'
import { LOYALTY_CONFIG } from '@/lib/loyalty/config'
import {
  Sparkles,
  ArrowLeft,
  Store,
  CreditCard,
  Gift,
  TrendingUp,
  History,
  LogOut,
  CheckCircle2,
} from 'lucide-react'

export default async function CustomerLoyaltyAppPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role || 'CUSTOMER'
  if (role === 'ADMIN') redirect('/admin')
  if (role === 'CASHIER') redirect('/cashier')

  // Fetch profile, customer loyalty status, and recent transactions
  const [{ data: profile }, { data: customer }, { data: transactions }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('first_name, last_name, email, phone_number')
        .eq('id', user.id)
        .single(),
      supabase
        .from('customers')
        .select('loyalty_points, status')
        .eq('id', user.id)
        .single(),
      supabase
        .from('transactions')
        .select('id, amount_total, points_earned, points_redeemed, created_at, cashier_id')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  const firstName = profile?.first_name || user.user_metadata?.first_name || ''
  const lastName = profile?.last_name || user.user_metadata?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Client'
  const phone = profile?.phone_number || user.user_metadata?.phone_number || ''
  const email = profile?.email || user.email || ''
  const points = customer?.loyalty_points ?? 0
  const tier = (customer?.status as 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP') || 'BRONZE'

  // Conversion: 100 points = 5 € (0.05 € per point)
  const euroDiscount = (points * 0.05).toFixed(2)

  // Calculate next tier progress
  const tiersList = [
    { name: 'BRONZE', min: LOYALTY_CONFIG.tiers.BRONZE.minHistoricalPoints },
    { name: 'SILVER', min: LOYALTY_CONFIG.tiers.SILVER.minHistoricalPoints },
    { name: 'GOLD', min: LOYALTY_CONFIG.tiers.GOLD.minHistoricalPoints },
    { name: 'VIP', min: LOYALTY_CONFIG.tiers.VIP.minHistoricalPoints },
  ]
  const currentTierIndex = tiersList.findIndex((t) => t.name === tier)
  const nextTier =
    currentTierIndex < tiersList.length - 1 ? tiersList[currentTierIndex + 1] : null
  const pointsToNext = nextTier ? Math.max(0, nextTier.min - points) : 0
  const progressPercent = nextTier
    ? Math.min(100, Math.round((points / nextTier.min) * 100))
    : 100

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--color-background)] text-[var(--color-text)] font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1.5 rounded-lg hover:bg-[var(--color-surface-hover,#f7f7f7)]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Mon Espace Client</span>
            </Link>
            <span className="text-[var(--color-border)] hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--color-text)]">
                Programme Fidélité
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs">
                Site Public
              </Button>
            </Link>
            <form action={logout}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-semibold hover:text-[var(--color-danger)]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1">
              <Link href="/account" className="hover:underline">
                Espace Client
              </Link>
              <span>/</span>
              <span className="text-[var(--color-text)] font-semibold">Fidélité &amp; Récompenses</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
              Vos Avantages Fidélité
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={tier} size="lg" />
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Points Balance Card */}
          <Card
            padded="lg"
            className="md:col-span-2 space-y-6 border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-base font-bold text-[var(--color-text)]">
                  Solde de Points Disponibles
                </h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Prêt à être utilisé en caisse
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-4xl sm:text-5xl font-black text-[var(--color-primary)] tracking-tight">
                  {points.toLocaleString('fr-FR')}
                </span>
                <span className="text-lg font-bold text-[var(--color-text-muted)] ml-2">
                  points
                </span>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1.5">
                  Valeur de réduction immédiate :{' '}
                  <strong className="text-[var(--color-text)] text-sm sm:text-base font-extrabold">
                    {euroDiscount} €
                  </strong>
                </p>
              </div>

              <div className="px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-1 sm:text-right">
                <div className="font-bold text-[var(--color-text)]">Formule de calcul :</div>
                <div>1 € d&apos;achat = 1 point fidélité</div>
                <div>100 points = 5 € de remise en caisse</div>
              </div>
            </div>

            {/* Next Tier Progression */}
            {nextTier ? (
              <div className="space-y-2 p-4 rounded-xl bg-[var(--color-surface-hover,#f9fafb)] border border-[var(--color-border)]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Progression vers le statut {nextTier.name}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    Plus que <strong className="text-[var(--color-text)]">{pointsToNext} points</strong>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Félicitations ! Vous avez atteint le statut VIP maximum.</span>
              </div>
            )}

            {/* In-Store Usage Notice */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
              <Store className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold">Comment utiliser vos points ?</span> Lors de votre passage
                en caisse au Super Market Calais, indiquez simplement votre nom ou votre numéro de
                téléphone (<strong className="font-semibold">{phone || 'rattaché à votre compte'}</strong>). Le caissier déduira immédiatement vos remises sur votre ticket.
              </div>
            </div>
          </Card>

          {/* Digital Bank-Style Loyalty Card */}
          <div className="space-y-4">
            <DigitalLoyaltyCard
              fullName={fullName}
              phone={phone}
              email={email}
              points={points}
              tier={tier}
              userId={user.id}
              createdAt={user.created_at}
            />

            {/* Quick Tip Card */}
            <Card padded="md" className="border-[var(--color-border)] text-xs space-y-2">
              <div className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Avantages exclusifs</span>
              </div>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                Profitez de réductions toute l&apos;année sans carte physique à transporter : vos points sont rattachés directement à votre profil.
              </p>
            </Card>
          </div>
        </div>

        {/* Transaction History Section */}
        <Card padded="lg" className="border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-base font-bold text-[var(--color-text)]">
                Dernières Opérations en Caisse
              </h2>
            </div>
            <span className="text-xs text-[var(--color-text-muted)] font-medium">
              {transactions && transactions.length > 0 ? `${transactions.length} opération(s)` : ''}
            </span>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {transactions.map((tx) => {
                const isEarn = (tx.points_earned || 0) > 0
                const isRedeem = (tx.points_redeemed || 0) > 0
                const txDate = new Date(tx.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-[var(--color-text)]">
                        {isEarn && `Achat en magasin de ${(Number(tx.amount_total) || 0).toFixed(2)} €`}
                        {isRedeem && !isEarn && `Remise fidélité utilisée en caisse`}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {txDate}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isEarn && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          +{tx.points_earned} pts
                        </span>
                      )}
                      {isRedeem && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-700 dark:text-rose-300">
                          -{tx.points_redeemed} pts
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)] space-y-1">
              <CreditCard className="w-8 h-8 mx-auto text-[var(--color-text-muted)] opacity-40 mb-2" />
              <p className="font-semibold text-[var(--color-text)]">Aucune transaction enregistrée</p>
              <p>Vos achats et déductions de points apparaîtront ici après votre prochain passage en caisse.</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
