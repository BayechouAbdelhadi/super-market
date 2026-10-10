import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/loyalty/StatusBadge'
import { getAllApps } from '@/lib/account/apps'
import {
  Sparkles,
  LogOut,
  Tag,
  UserCheck,
  ArrowRight,
  Store,
  Phone,
  Mail,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react'

export default async function AccountHubPage() {
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

  // Fetch customer profile and loyalty info
  const [{ data: profile }, { data: customer }] = await Promise.all([
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
  ])

  const firstName = profile?.first_name || user.user_metadata?.first_name || ''
  const lastName = profile?.last_name || user.user_metadata?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Client'
  const email = profile?.email || user.email || ''
  const phone = profile?.phone_number || user.user_metadata?.phone_number || ''
  const points = customer?.loyalty_points ?? 0
  const tier = (customer?.status as 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP') || 'BRONZE'
  const euroDiscount = (points * 0.05).toFixed(2)

  const apps = getAllApps()

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--color-background)] text-[var(--color-text)] font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
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
              <p className="text-[11px] text-[var(--color-text-muted)]">Portail Client</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                Site Public
              </Button>
            </Link>
            <form action={logout}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-semibold hover:text-[var(--color-danger)] hover:border-rose-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Se déconnecter</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-surface-hover,#f9fafb)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Espace Personnel Sécurisé</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
              Bonjour, {firstName || fullName} !
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
              Bienvenue sur votre portail client Super Market Calais. Retrouvez ci-dessous l&apos;ensemble de vos applications, avantages et services connectés.
            </p>
          </div>

          {/* Quick Profile Summary Badge */}
          <div className="px-5 py-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs space-y-2 shadow-xs shrink-0 min-w-[240px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--color-text-muted)]">Statut fidélité :</span>
              <StatusBadge status={tier} size="sm" />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--color-border)]/60">
              <span className="text-[var(--color-text-muted)]">Solde de points :</span>
              <strong className="text-[var(--color-primary)] font-bold">{points} pts</strong>
            </div>
          </div>
        </div>

        {/* Apps & Services Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-text)] tracking-tight">
                Vos Applications &amp; Services
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Sélectionnez une application pour accéder à ses fonctionnalités dédiées.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App 1: Programme Fidélité (The Active Fragment) */}
            <Link
              href="/account/loyalty"
              className="group block focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Accent line top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary)]" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        Actif
                      </span>
                      <StatusBadge status={tier} size="sm" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                      Programme Fidélité
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Suivez votre solde de points cumulés, vos remises en caisse et l&apos;historique complet de vos achats.
                    </p>
                  </div>

                  {/* Metrics preview chip */}
                  <div className="p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[var(--color-text-muted)] block">Solde disponible</span>
                      <span className="text-base font-black text-[var(--color-primary)]">
                        {points} pts
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[var(--color-text-muted)] block">Remise caisse</span>
                      <span className="text-sm font-bold text-[var(--color-text)]">
                        {euroDiscount} €
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-[var(--color-primary)] group-hover:translate-x-1 transition-transform">
                  <span>Accéder à l&apos;espace fidélité</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 2: Catalogues & Promotions (Future App Card) */}
            <Card
              padded="lg"
              className="h-full border-[var(--color-border)] bg-[var(--color-surface)] opacity-85 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Tag className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Bientôt disponible
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--color-text)]">
                    Catalogues &amp; Bons Plans
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                    Découvrez les arrivages hebdomadaires et réductions exclusives du magasin Super Market Calais.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--color-border)] text-[11px] font-medium text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Bientôt disponible en ligne</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Profile & Store Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Profile Card */}
          <Card
            padded="lg"
            className="md:col-span-2 space-y-4 border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-[var(--color-text)]">Vos Coordonnées de Compte</h3>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Identifiants pour la caisse</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-hover,#f9fafb)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] block text-[11px]">Nom &amp; Prénom</span>
                <span className="font-bold text-[var(--color-text)] text-sm mt-0.5 block truncate">
                  {fullName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--color-surface-hover,#f9fafb)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] block text-[11px]">Téléphone</span>
                <span className="font-bold text-[var(--color-text)] text-sm mt-0.5 flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{phone || 'Non renseigné'}</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--color-surface-hover,#f9fafb)] border border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] block text-[11px]">Adresse email</span>
                <span className="font-bold text-[var(--color-text)] text-sm mt-0.5 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                  <span className="truncate">{email}</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
              Pour modifier votre numéro de téléphone ou mettre à jour votre profil, adressez-vous directement à l&apos;accueil du magasin ou contactez notre équipe.
            </p>
          </Card>

          {/* Store Location Card */}
          <Card
            padded="lg"
            className="space-y-4 border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
                <Store className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text)]">Votre Magasin</h3>
              </div>

              <div className="space-y-2 text-xs text-[var(--color-text)]">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Super Market Calais</span>
                    <span className="text-[var(--color-text-muted)]">205 Avenue Antoine de Saint-Exupéry, 62100 Calais</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-[var(--color-border)]">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[11px]">Horaires d&apos;ouverture</span>
                    <span className="text-[var(--color-text-muted)]">Lundi – Samedi : 08h30 – 20h00</span>
                    <span className="text-[var(--color-text-muted)] block">Dimanche : 09h00 – 13h00</span>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/" className="pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                Voir les informations du magasin
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}
