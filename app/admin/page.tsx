import { createClient } from "@/lib/supabase/server";
import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";
import { getAppSettings } from "@/lib/settings/service";
import { SupabaseSelfProfileRepository } from "@/lib/account/adapters/supabase-self-profile-repository";
import { resolveDisplayIdentity } from "@/lib/account/identity";
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
  Sparkles,
  Sliders,
} from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
  description: "Portail des applications et modules d'administration",
};

export default async function AdminHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email || "";

  // Fetch profile, quick analytics overview, and store settings
  const [profile, analytics, settings] = await Promise.all([
    user ? new SupabaseSelfProfileRepository(supabase).getProfile(user.id) : null,
    getDashboardAnalytics().catch(() => null),
    getAppSettings(),
  ]);

  const identity = resolveDisplayIdentity(profile, user ?? {});
  const displayName = identity.fullName || email || "Administrateur";

  const todayRevenue = analytics?.kpis.caToday ?? 0;
  const todayTransactions = analytics?.kpis.dailySalesCount ?? 0;
  const totalCustomers = analytics?.kpis.totalClients ?? 0;

  return (
    <div className="space-y-8">
        {/* Admin Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-surface-hover)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success-subtle text-success-text border border-success-border">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Console Administrateur</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
              Bonjour, {displayName} !
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
              Bienvenue sur le portail d&apos;administration {settings.store.storeName}. Retrouvez ici tous vos modules de gestion, applications caisse et outils d&apos;analyse.
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
              <strong className="text-sm sm:text-base font-extrabold text-success-text block mt-0.5">
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
              href="/admin/pos"
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
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success-subtle text-success-text border border-success-border">
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
              className="group block focus:outline-none focus:ring-2 focus:ring-info rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-info/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-info" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-info-subtle text-info-text flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-info-subtle text-info-text border border-info-border">
                      En direct
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-info-text transition-colors">
                      Analytics &amp; Ventes
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Chiffre d&apos;affaires, évolution des ventes, panier moyen et graphiques de performance du magasin.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-info-text group-hover:translate-x-1 transition-transform">
                  <span>Voir les statistiques</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 3: Gestion des Clients */}
            <Link
              href="/admin/customers"
              className="group block focus:outline-none focus:ring-2 focus:ring-success rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-success/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-success" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-success-subtle text-success-text flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success-subtle text-success-text border border-success-border">
                      Base active
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-success-text transition-colors">
                      Gestion des Clients
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Base de données des clients fidélité, soldes de points, modification des coordonnées et fiches détaillées.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-success-text group-hover:translate-x-1 transition-transform">
                  <span>Gérer les clients</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 4: Gestion des Caissiers */}
            <Link
              href="/admin/cashiers"
              className="group block focus:outline-none focus:ring-2 focus:ring-highlight rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-highlight/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-highlight" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-highlight-subtle text-highlight-text flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UserCog className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-highlight-subtle text-highlight-text border border-highlight-border">
                      Équipe
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-highlight-text transition-colors">
                      Gestion des Caissiers
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Comptes du personnel de caisse, invitations Brevo par e-mail et contrôle des accès sécurisés.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-highlight-text group-hover:translate-x-1 transition-transform">
                  <span>Gérer les caissiers</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 5: Flux d'Activité en Direct */}
            <Link
              href="/admin/live"
              className="group block focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Temps réel
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-primary transition-colors">
                      Flux en Direct
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Monitoring en direct des événements, passages en caisse et opérations fidélité enregistrées.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Voir le flux live</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 6: Bons Plans & Campagnes E-mails */}
            <Link
              href="/admin/deals"
              className="group block focus:outline-none focus:ring-2 focus:ring-info rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-info/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-info" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-info-subtle text-info-text flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-info-subtle text-info-text border border-info-border">
                      Marketing
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-info-text transition-colors">
                      Bons Plans &amp; Campagnes E-mails
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Programmation de newsletters promotionnelles ciblées par palier fidélité (Bronze à VIP), envoi instantané ou limité par jour.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-info-text group-hover:translate-x-1 transition-transform">
                  <span>Créer une campagne</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 7: Configuration & Paramètres du Magasin */}
            <Link
              href="/admin/settings"
              className="group block focus:outline-none focus:ring-2 focus:ring-warning rounded-2xl"
            >
              <Card
                padded="lg"
                className="h-full border-[var(--color-border)] bg-[var(--color-surface)] hover:border-warning/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-warning" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-warning-subtle text-warning-text flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-warning-subtle text-warning-text border border-warning-border">
                      Admin Only
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-warning-text transition-colors">
                      Configuration de l&apos;App
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      Valeur monétaire des points (0.05 €), seuils de remises, paramètres de caisse et identité commerciale.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-warning-text group-hover:translate-x-1 transition-transform">
                  <span>Configurer l&apos;application</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* App 7: Stocks & Inventaire (Future App Card) */}
            <Card
              padded="lg"
              className="h-full border-[var(--color-border)] bg-[var(--color-surface)] opacity-85 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-warning-subtle text-warning-text flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-warning-subtle text-warning-text border border-warning-border">
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
