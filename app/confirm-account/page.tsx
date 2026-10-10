import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ConfirmAccountForm } from '@/components/auth/ConfirmAccountForm'
import {
  verifySignedToken,
  AccountActivationPayload,
} from '@/lib/email/otp-security'
import { AlertCircle, ArrowLeft } from 'lucide-react'

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
  const payload = token ? verifySignedToken<AccountActivationPayload>(token) : null
  const isExpired = payload ? Date.now() > payload.expiresAt : true
  const isValid = payload && payload.type === 'ACCOUNT_ACTIVATION' && !isExpired

  const isCashier = payload?.role === 'CASHIER'

  const title = isCashier
    ? "Activez votre compte caissier"
    : "Activez votre compte fidélité"

  const subtitle = isCashier
    ? "Vous avez été invité(e) par l'administrateur à collaborer sur la caisse Super Market Calais. Définissez votre mot de passe pour accéder à votre espace."
    : "Votre compte a été créé lors de votre dernier passage à la caisse. Définissez votre mot de passe pour suivre vos points et remises fidélité en ligne."

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col items-center bg-[var(--color-background)] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md my-auto space-y-5 py-4 sm:py-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center mb-1 group">
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

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-sm mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Content Card */}
        <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
          {isValid ? (
            <ConfirmAccountForm
              email={payload.email}
              token={token}
              role={payload.role}
            />
          ) : (
            <div className="space-y-5 text-center py-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-bold text-[var(--color-text)]">
                  Lien d&apos;activation invalide ou expiré
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Ce lien de confirmation a expiré ou n&apos;est plus valide. Si vous avez déjà créé votre compte, vous pouvez vous connecter ou demander un nouveau mot de passe.
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
                <Link
                  href="/forgot-password"
                  className="w-full inline-flex items-center justify-center h-10 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover,#f7f7f7)] text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                >
                  Demander un nouveau lien de connexion
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

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Retour au site public</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
