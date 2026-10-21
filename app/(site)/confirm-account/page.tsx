import type { Metadata } from 'next'
import Link from 'next/link'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { AuthShell, authLinkClass } from '@/components/public/AuthShell'
import { ConfirmAccountForm } from '@/components/auth/ConfirmAccountForm'
import { verifyActivationToken } from '@/lib/email/otp-security'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Activer votre compte', robots: PRIVATE_PAGE_ROBOTS };
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

export default async function ConfirmAccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string
  }>
}) {
  const params = await searchParams
  const token = params?.token?.trim() || ''

  // Verify HMAC-signed activation token
  const payload = token ? verifyActivationToken(token) : null

  const isCashier = payload?.role === 'CASHIER'

  const title = isCashier
    ? "Activez votre compte caissier"
    : "Activez votre compte fidélité"

  const subtitle = isCashier
    ? "Vous avez été invité(e) par l'administrateur à collaborer sur la caisse Super Market Calais. Définissez votre mot de passe pour accéder à votre espace."
    : "Votre compte a été créé lors de votre dernier passage à la caisse. Définissez votre mot de passe pour suivre vos points et remises fidélité en ligne."

  if (!payload) {
    return (
      <AuthShell
        icon={AlertCircle}
        iconTone="danger"
        title="Lien expiré ou invalide"
        description="Ce lien d'activation n'est plus valable. Si votre compte existe déjà, connectez-vous ou demandez un nouveau mot de passe."
        footer={
          <Link href="/login" className={authLinkClass}>
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à la connexion</span>
          </Link>
        }
      >
        <Link href="/forgot-password" className={cn(buttonVariants({ variant: 'primary' }), 'w-full')}>
          Recevoir un nouveau lien
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={title} description={subtitle}>
      <ConfirmAccountForm email={payload.email} token={token} role={payload.role} />
    </AuthShell>
  )
}
