import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, ArrowLeft, ArrowRight, Coins, Gift, Tag } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmAccountForm } from "@/components/auth/ConfirmAccountForm";
import { AuthShell, authLinkClass } from "@/components/public/AuthShell";
import { getAppSettings } from "@/lib/settings/service";
import { verifyActivationToken } from "@/lib/email/otp-security";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

export const metadata: Metadata = { title: "Invitation", robots: PRIVATE_PAGE_ROBOTS };

const backToLogin = (
  <Link href="/login" className={authLinkClass}>
    <ArrowLeft className="h-4 w-4" />
    <span>Retour à la connexion</span>
  </Link>
);

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
  const payload = token ? verifyActivationToken(token) : null;
  const isCashier = payload?.role === "CASHIER" || params?.role === "CASHIER";

  if (payload) {
    return (
      <AuthShell
        title={isCashier ? "Activez votre compte caissier" : "Activez votre compte fidélité"}
        description={
          isCashier
            ? "Vous avez été invité(e) par l'administrateur. Choisissez votre mot de passe pour accéder à la caisse."
            : "Votre compte a été créé en caisse. Choisissez votre mot de passe pour suivre vos points en ligne."
        }
      >
        <ConfirmAccountForm email={payload.email} token={token} role={payload.role} />
      </AuthShell>
    );
  }

  if (token) {
    return (
      <AuthShell
        icon={AlertCircle}
        iconTone="danger"
        title="Invitation expirée ou invalide"
        description="Ce lien a expiré ou a déjà été utilisé. Vous pouvez créer votre compte directement, ou vous connecter s'il existe déjà."
        footer={backToLogin}
      >
        <Link href="/signup" className={cn(buttonVariants({ variant: "primary" }), "w-full")}>
          Créer mon compte
        </Link>
      </AuthShell>
    );
  }

  const { loyalty } = await getAppSettings();
  const ratio = loyalty.euroToPointsRatio;
  const benefits: { icon: LucideIcon; title: string; text: string }[] = [
    {
      icon: Coins,
      title: `1 € dépensé = ${ratio} point${ratio > 1 ? "s" : ""}`,
      text: "À chaque passage en caisse, sur tout le magasin.",
    },
    { icon: Gift, title: "Remises immédiates", text: "Utilisez vos points en caisse pour réduire le total." },
    { icon: Tag, title: "Offres réservées aux membres", text: "Des promotions exclusives toute l'année." },
  ];

  return (
    <AuthShell
      title="Bienvenue chez Super Market Calais"
      description="Rejoignez notre programme fidélité gratuit et profitez de réductions à chaque passage en caisse."
      footer={
        <p className="text-text-muted">
          Déjà membre ?{" "}
          <Link href="/login" className="font-semibold text-primary-ink underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <ul className="space-y-5">
          {benefits.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-surface-hover text-text">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold text-text">{title}</p>
                <p className="text-sm text-text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/signup" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
          <span>Créer mon compte</span>
          <ArrowRight />
        </Link>
      </div>
    </AuthShell>
  );
}
