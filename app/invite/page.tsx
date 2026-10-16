import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ConfirmAccountForm } from "@/components/auth/ConfirmAccountForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import {
  verifySignedToken,
  AccountActivationPayload,
} from "@/lib/email/otp-security";
import {
  Sparkles,
  ShieldCheck,
  Tag,
  Gift,
  AlertCircle,
  ArrowLeft,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { PrintInviteButton } from "@/components/invite/PrintInviteButton";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: string;
  }>;
}) {
  const params = await searchParams;
  const token = params?.token?.trim() || "";
  const emailParam = params?.email?.trim() || "";
  const firstNameParam = params?.first_name?.trim() || "";
  const lastNameParam = params?.last_name?.trim() || "";
  const phoneParam = params?.phone?.trim() || "";

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

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {isCashier ? "Invitation Équipe Caisse" : "Invitation Club Fidélité"}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
            {hasToken
              ? isCashier
                ? "Activez votre compte caissier"
                : "Activez votre compte fidélité"
              : "Rejoignez Super Market Calais"}
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-lg mx-auto leading-relaxed">
            {hasToken
              ? isCashier
                ? "Vous avez été invité(e) par l'administrateur. Définissez votre mot de passe pour accéder à la caisse."
                : "Votre compte a été créé. Définissez votre mot de passe pour suivre vos points et remises en temps réel."
              : "Vous êtes invité(e) à créer votre compte fidélité pour cumuler des points et profiter de réductions exclusives."}
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
                  <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
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
                      href="/invite"
                      className="w-full inline-flex items-center justify-center h-10 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                    >
                      Créer mon compte sans ce lien
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
          /* Public / Direct Invitation Flow: 2-Column Benefits & Account Creation */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Perks & Reassurance */}
            <div className="lg:col-span-5 space-y-5 order-2 lg:order-1">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  Vos avantages fidélité exclusifs
                </h2>

                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block">1 € dépensé = 1 point</strong>
                      Cumulez des points sur chaque passage en caisse en indiquant simplement votre nom ou numéro.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block">Remises immédiates</strong>
                      Convertissez vos points en réductions directes sur vos achats alimentaires et primeurs.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block">Bons plans de la semaine</strong>
                      Recevez en avant-première nos promotions et arrivages frais réservés aux adhérents.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block">100% gratuit et sans engagement</strong>
                      Aucune carte bancaire requise. Votre compte est utilisable instantanément au comptoir.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Already Have an Account Prompt */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center text-xs text-slate-600">
                Vous possédez déjà un compte fidélité ?{" "}
                <Link href="/login" className="font-bold text-rose-600 hover:text-rose-700 underline">
                  Connectez-vous ici
                </Link>
              </div>
            </div>

            {/* Right: Registration Form */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
                <div className="mb-5 pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-rose-600" />
                    Créer mon compte en 30 secondes
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Renseignez vos coordonnées pour activer votre profil fidélité.
                  </p>
                </div>

                <SignUpForm
                  initialData={{
                    email: emailParam,
                    firstName: firstNameParam,
                    lastName: lastNameParam,
                    phone: phoneParam,
                  }}
                />
              </Card>
            </div>
          </div>
        )}

        {/* Back Link & Quick Print */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la page d&apos;accueil du magasin</span>
          </Link>
          <span className="hidden sm:inline text-slate-300">·</span>
        </div>
      </div>
    </div>
  );
}
