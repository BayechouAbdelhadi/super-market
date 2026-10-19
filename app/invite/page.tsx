import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ConfirmAccountForm } from "@/components/auth/ConfirmAccountForm";
import {
  verifySignedToken,
  AccountActivationPayload,
} from "@/lib/email/otp-security";
import {
  Sparkles,
  Tag,
  Gift,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Coins,
} from "lucide-react";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    role?: string;
  }>;
}) {
  const params = await searchParams;
  const token = params?.token?.trim() || "";

  // Verify HMAC-signed activation token if present
  const payload = token ? verifySignedToken<AccountActivationPayload>(token) : null;
  const isExpired = payload ? Date.now() > payload.expiresAt : true;
  const hasToken = Boolean(token);
  const isTokenValid = payload && payload.type === "ACCOUNT_ACTIVATION" && !isExpired;

  const isCashier = payload?.role === "CASHIER" || params?.role === "CASHIER";

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--color-background)] font-sans">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3 mb-8">
          <Link href="/" className="inline-flex items-center justify-center group">
            <div className="h-20 w-20 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] p-1 shadow-[0_6px_24px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center">
              <Image
                src="/logo-hq.png"
                alt="SuperMarket Logo"
                width={80}
                height={80}
                priority
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger-subtle border border-danger-border text-danger-text text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {isCashier ? "Invitation Équipe Caisse" : "Programme Fidélité Magasin"}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
            {hasToken
              ? isCashier
                ? "Activez votre compte caissier"
                : "Activez votre compte fidélité"
              : "Bienvenue chez Super Market Calais"}
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-lg mx-auto leading-relaxed">
            {hasToken
              ? isCashier
                ? "Vous avez été invité(e) par l'administrateur. Définissez votre mot de passe pour accéder à la caisse."
                : "Votre compte a été créé. Définissez votre mot de passe pour suivre vos points et remises en temps réel."
              : "Rejoignez notre programme de fidélité gratuit pour cumuler des points et profiter de réductions immédiates à chaque passage en caisse."}
          </p>
        </div>

        {/* Main Content Area */}
        {hasToken ? (
          /* Token Provided Flow: Activation */
          <div className="w-full max-w-md">
            <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
              {isTokenValid && payload ? (
                <ConfirmAccountForm
                  email={payload.email}
                  token={token}
                  role={payload.role}
                />
              ) : (
                <div className="space-y-5 text-center py-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-danger-subtle text-danger-text flex items-center justify-center border border-danger-border">
                    <AlertCircle className="w-6 h-6" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-[var(--color-text)]">
                      Lien d&apos;invitation invalide ou expiré
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                      Ce lien d&apos;invitation a expiré ou a déjà été utilisé. Vous pouvez créer votre compte directement ci-dessous ou demander un nouveau mot de passe.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
                    <Link
                      href="/signup"
                      className="w-full inline-flex items-center justify-center h-10 rounded-xl bg-danger text-on-color text-xs font-bold hover:bg-danger/90 transition-colors"
                    >
                      Créer mon compte
                    </Link>
                    <Link
                      href="/login"
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Retour à la page de connexion</span>
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* Public / Direct Invitation Flow: Welcome & CTA to Signup */
          <div className="w-full max-w-lg space-y-6">
            <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)] text-center space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger-subtle border border-danger-border text-danger-text text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Vos avantages fidélité
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">
                  Fidélité Super Market Calais
                </h2>
                <p className="text-xs sm:text-sm text-text-muted max-w-sm mx-auto">
                  Cumulez des points sur tous vos achats et bénéficiez de réductions directes.
                </p>
              </div>

              {/* 3 Key Benefits */}
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="p-3.5 rounded-xl bg-surface-hover border border-border flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-danger-subtle text-danger-text shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-text">1 € dépensé = 1 point</div>
                    <div className="text-[11px] text-text-muted">À chaque passage en caisse, sur tout le magasin</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-hover border border-border flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-success-subtle text-success-text shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-text">Remises immédiates en caisse</div>
                    <div className="text-[11px] text-text-muted">Déduisez directement vos points lors de vos achats</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-hover border border-border flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-info-subtle text-info-text shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-text">Promotions &amp; bons plans exclusifs</div>
                    <div className="text-[11px] text-text-muted">Offres réservées aux adhérents toute l&apos;année</div>
                  </div>
                </div>
              </div>

              {/* Primary Call to Action Button to Signup Page */}
              <div className="space-y-3 pt-2">
                <Link
                  href="/signup"
                  className="w-full h-12 rounded-xl bg-text hover:bg-text/90 text-background font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                >
                  <span>Créer mon compte fidélité (30 secondes)</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Link>

                <p className="text-xs text-text-muted">
                  Vous possédez déjà un compte fidélité ?{" "}
                  <Link href="/login" className="font-bold text-danger-text hover:underline">
                    Connectez-vous
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la page d&apos;accueil du magasin</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
