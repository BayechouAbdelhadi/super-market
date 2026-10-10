import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Store,
  BarChart3,
  Users,
  UserCog,
  Activity,
  Package,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuperMarket Calais — Console Administration",
  description: "Portail des applications et modules d'administration",
};

export default async function AdminHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role || "ADMIN";
  const email = user?.email || "";

  // Fetch profile and quick analytics overview
  const [{ data: profile }, analytics] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user?.id || "")
      .single(),
    getDashboardAnalytics().catch(() => null),
  ]);

  const firstName = profile?.first_name || user?.user_metadata?.first_name || "";
  const lastName = profile?.last_name || user?.user_metadata?.last_name || "";
  const displayName = `${firstName} ${lastName}`.trim() || email || "Administrateur";

  const todayRevenue = analytics?.kpis.caToday ?? 0;
  const todayTransactions = analytics?.kpis.dailySalesCount ?? 0;
  const totalCustomers = analytics?.kpis.totalClients ?? 0;

  return (
    <DashboardLayout role={role} email={email}>
      <div className="space-y-8">
        {/* Admin Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-surface-hover,#f9fafb)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Console Administrateur</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
              Bonjour, {displayName} !
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
              Bienvenue sur le portail d&apos;administration Super Market Calais. Retrouvez ici tous vos modules de gestion, applications caisse et outils d&apos;analyse.
            </p>
          </div>

          {/* KPI Mini-Pills */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs shadow-xs min-w-[120px]">
              <span className="text-[var(--color-text-muted)] block text-[11px]">Ventes du jour</span>
              <strong className="text-sm sm:text-base font-extrabold text-[var(--color-primary)] block mt-0.5">
                {todayRevenue.toFixed(2)} €
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs shadow-xs min-w-[120px]">
              <span className="text-[var(--color-text-muted)] block text-[11px]">Passages caisse</span>
              <strong className="text-sm sm:text-base font-extrabold text-[var(--color-text)] block mt-0.5">
                {todayTransactions}
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs shadow-xs min-w-[120px]">
              <span className="text-[var(--color-text-muted)] block text-[11px]">Clients fidélité</span>
              <strong className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {totalCustomers}
              </strong>
            </div>
          </div>
        </div>

        {/* Admin Apps Grid */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-text)] tracking-tight">
              Applications &amp; Modules du Magasin
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Accédez aux outils d&apos;encaissement, aux statistiques de vente ou à la gestion des équipes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* App 1: Terminal Caisse Fidélité */}
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
                      Terminal Caisse Fidélité
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Ouvrir l&apos;interface de caisse pour enregistrer des achats clients et appliquer les remises fidélité.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-[var(--color-primary)] group-hover:translate-x-1 transition-transform">
                  <span>Ouvrir la caisse</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 2: Analytics & Indicateurs Financiers */}
            <Link
              href="/admin/analytics"
              className="group block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-blue-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                      En direct
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-blue-600 transition-colors">
                      Analytics &amp; Ventes
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Chiffre d&apos;affaires, évolution des ventes, panier moyen et graphiques de performance du magasin.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Voir les statistiques</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 3: Gestion des Clients */}
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
                      Base active
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-emerald-600 transition-colors">
                      Gestion des Clients
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Base de données des clients fidélité, soldes de points, modification des coordonnées et fiches détaillées.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  <span>Gérer les clients</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 4: Gestion des Caissiers */}
            <Link
              href="/admin/cashiers"
              className="group block focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-purple-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UserCog className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      Équipe
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-purple-600 transition-colors">
                      Gestion des Caissiers
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Comptes du personnel de caisse, invitations Brevo par e-mail et contrôle des accès sécurisés.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                  <span>Gérer les caissiers</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 5: Flux d'Activité en Direct */}
            <Link
              href="/admin/live"
              className="group block focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-pink-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-pink-500" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                      Temps réel
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-pink-600 transition-colors">
                      Flux en Direct
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Monitoring en direct des événements, passages en caisse et opérations fidélité enregistrées.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-pink-600 group-hover:translate-x-1 transition-transform">
                  <span>Voir le flux live</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 6: Stocks & Inventaire (Future App Card) */}
            <Card
              padded="lg"
              className="h-full border-[var(--color-border)] bg-[var(--color-surface)] opacity-85 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Bientôt disponible
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--color-text)]">
                    Stocks &amp; Inventaire
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                    Gestion du catalogue produits, arrivages hebdomadaires et seuils d&apos;alerte réapprovisionnement.
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
      </div>
    </DashboardLayout>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width={14}
      height={14}
      {...props}
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
  );
}
