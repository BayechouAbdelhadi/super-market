import { resetPassword } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { OtpSubmitButton } from '@/components/auth/OtpSubmitButton'
import { verifySignedToken, PendingResetPayload } from '@/lib/email/otp-security'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string
    message?: string
    token?: string
  }>
}) {
  const params = await searchParams
  const token = params?.token?.trim() || ''

  // Decode cryptographically signed email strictly from token (not from browser cookies/session)
  const pendingData = token ? verifySignedToken<PendingResetPayload>(token) : null
  const targetEmail = pendingData?.email || params?.email?.trim() || ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
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
            Nouveau mot de passe
          </h1>
          {targetEmail ? (
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xs mx-auto">
              Réinitialisation pour le compte :{" "}
              <strong className="text-[var(--color-text)] font-semibold">{targetEmail}</strong>
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xs mx-auto">
              Définissez votre nouveau mot de passe pour accéder à votre compte.
            </p>
          )}
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
          {targetEmail && (
            <div className="mb-4 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-[var(--radius-button,12px)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Lien vérifié pour <strong>{targetEmail}</strong>
              </span>
            </div>
          )}

          <form action={resetPassword} className="space-y-4">
            <input type="hidden" name="email" value={targetEmail} />
            <input type="hidden" name="token" value={token} />

            <Input
              id="password"
              name="password"
              type="password"
              label="Nouveau mot de passe"
              placeholder="••••••••"
              required
              autoFocus
              className="h-11"
            />

            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              label="Confirmer le nouveau mot de passe"
              placeholder="••••••••"
              required
              className="h-11"
            />

            {params?.message && (
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 text-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-[var(--radius-button,12px)]">
                {params.message}
              </div>
            )}

            <OtpSubmitButton label="Enregistrer mon nouveau mot de passe" />

            <div className="pt-2 text-center border-t border-[var(--color-border)]">
              <Link
                href="/login"
                className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
