import { createClient } from '@/lib/supabase/server'
import { ProtectedDashboard } from '@/components/ui/ProtectedDashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Store,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MapPin,
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "SuperMarket Calais — Espace Caisse",
  description: "Portail des applications et outils pour les caissiers",
}

export default async function CashierHubPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', user?.id || '')
    .single()

  const firstName = profile?.first_name || user?.user_metadata?.first_name || ''
  const lastName = profile?.last_name || user?.user_metadata?.last_name || ''
  const displayName = `${firstName} ${lastName}`.trim() || user?.email || 'Caissier'

  return (
    <ProtectedDashboard requiredRole="CASHIER">
      <div className="space-y-8">
        {/* Cashier Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-surface-hover,#f9fafb)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Session Caisse Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
              Bonjour, {displayName} !
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
              Bienvenue sur votre portail caisse Super Market Calais. Sélectionnez un outil ci-dessous pour démarrer vos opérations au comptoir.
            </p>
          </div>

          <div className="px-5 py-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs space-y-1.5 shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[var(--color-text)]">Magasin Calais — Caisse #1</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Connecté en tant que caissier habilité
            </p>
          </div>
        </div>

        {/* Cashier Apps & Tools Grid */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-text)] tracking-tight">
              Vos Applications &amp; Outils
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Choisissez l&apos;application pour accéder au terminal de caisse ou à la gestion client.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* App 1: Caisse & Points Fidélité (The Active POS Fragment) */}
            <Link
              href="/cashier/pos"
              className="group block focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary)]" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Store className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Opérationnel
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                      Caisse &amp; Points Fidélité
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Rechercher des clients au comptoir, enregistrer les achats (1 € = 1 pt) et appliquer les remises fidélité immédiates.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-[var(--color-primary)] group-hover:translate-x-1 transition-transform">
                  <span>Ouvrir le terminal caisse</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 2: Annuaire des Clients */}
            <Link
              href="/customers"
              className="group block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Disponible
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-emerald-600 transition-colors">
                      Annuaire des Clients
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Consulter les profils clients inscrits, créer un nouveau compte fidélité ou mettre à jour un numéro de téléphone.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  <span>Consulter les clients</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 3: Clôture de Caisse (Future App Card) */}
            <Card
              padded="lg"
              className="h-full border-[var(--color-border)] bg-[var(--color-surface)] opacity-85 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                    Bientôt disponible
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--color-text)]">
                    Clôture de Caisse
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                    Bilan des passages en caisse, récapitulatif des remises accordées et fermeture de session.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[var(--color-border)] text-[11px] font-medium text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Module en cours de développement</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Cashier Quick Instructions */}
        <Card padded="lg" className="border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
            <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-sm font-bold text-[var(--color-text)]">Rappels pour la Caisse</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[var(--color-text-muted)]">
            <p>
              • <strong>Attribution des points</strong> : demandez le numéro de téléphone ou le nom du client avant de finaliser l&apos;encaissement. 1 € dépensé = 1 point fidélité.
            </p>
            <p>
              • <strong>Déduction des remises</strong> : 100 points donnent droit à 5 € de réduction immédiate sur le total du ticket du client.
            </p>
          </div>
        </Card>
      </div>
    </ProtectedDashboard>
  )
}
