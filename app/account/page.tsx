import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/loyalty/StatusBadge'
import { User, Phone, Mail, LogOut, ArrowLeft, Store, Sparkles, Gift } from 'lucide-react'

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

  // Fetch customer profile & loyalty points from Supabase
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone_number')
    .eq('id', user.id)
    .single()

  const { data: customer } = await supabase
    .from('customers')
    .select('loyalty_points, status')
    .eq('id', user.id)
    .single()

  const firstName = profile?.first_name || user.user_metadata?.first_name || ''
  const lastName = profile?.last_name || user.user_metadata?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Client'
  const email = profile?.email || user.email || ''
  const phone = profile?.phone_number || user.user_metadata?.phone_number || ''
  const points = customer?.loyalty_points ?? 0
  const tier = (customer?.status as "BRONZE" | "SILVER" | "GOLD" | "VIP") || "BRONZE"

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] p-0.5 shadow-xs overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logo-hq.png"
                alt="SuperMarket Logo"
                width={44}
                height={44}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-[var(--color-text)]">
                Super Market Calais
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">Espace Client &amp; Fidélité</p>
            </div>
          </Link>

          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-semibold hover:text-[var(--color-danger)] hover:border-rose-300"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
              Bonjour, {firstName || fullName} !
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
              Bienvenue sur votre espace fidélité Super Market Calais.
            </p>
          </div>
          <Link href="/">
            <Button variant="secondary" size="sm" className="gap-2 text-xs font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au site public</span>
            </Button>
          </Link>
        </div>

        {/* Loyalty Points Highlight Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padded="lg" className="md:col-span-2 space-y-6 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-base font-bold text-[var(--color-text)]">Votre Solde de Points</h2>
              </div>
              <StatusBadge status={tier} size="md" />
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-4xl sm:text-5xl font-black text-[var(--color-primary)] tracking-tight">
                  {points.toLocaleString('fr-FR')}
                </span>
                <span className="text-base font-bold text-[var(--color-text-muted)] ml-2">points</span>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Équivalent remise : <span className="font-bold text-[var(--color-text)]">{(points * 0.05).toFixed(2)} €</span> à déduire en caisse
                </p>
              </div>

              <div className="px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-1">
                <div className="font-bold text-[var(--color-text)]">Règle de cumul :</div>
                <div>1 € dépensé = 1 point fidélité</div>
                <div>100 points = 5 € de remise</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
              <Store className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold">Comment utiliser vos points ?</span> Lors de vos passages en caisse au Super Market Calais (205 Avenue Antoine de Saint-Exupéry), indiquez simplement votre nom ou votre numéro de téléphone au caissier pour cumuler ou déduire vos points immédiatement sur votre total.
              </div>
            </div>
          </Card>

          {/* Profile Details Card */}
          <Card padded="lg" className="space-y-5 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
                <User className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text)]">Vos Coordonnées</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[var(--color-text-muted)] block">Nom &amp; Prénom</span>
                  <span className="font-bold text-[var(--color-text)]">{fullName}</span>
                </div>

                {phone && (
                  <div>
                    <span className="text-[var(--color-text-muted)] block">Téléphone</span>
                    <span className="font-bold text-[var(--color-text)] flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{phone}</span>
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[var(--color-text-muted)] block">Email</span>
                  <span className="font-bold text-[var(--color-text)] flex items-center gap-1.5 mt-0.5 break-all">
                    <Mail className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>{email}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
              <Gift className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span>Membre du programme fidélité Super Market</span>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
