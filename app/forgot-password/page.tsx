import { requestPasswordReset } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { OtpSubmitButton } from '@/components/auth/OtpSubmitButton'
import { ArrowLeft, CheckCircle2, MailCheck } from 'lucide-react'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; status?: string; email?: string }>
}) {
  const params = await searchParams
  const isSent = params?.status === 'sent'
  const emailSentTo = params?.email || ''

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
            {isSent ? "Email envoyé !" : "Mot de passe oublié"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xs mx-auto">
            {isSent
              ? "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe."
              : "Entrez votre adresse email pour recevoir votre lien de réinitialisation sécurisé."}
          </p>
        </div>

        {/* Card */}
        <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
          {isSent ? (
            /* Confirmation State: Show confirmation and nothing else */
            <div className="space-y-5 text-center py-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <MailCheck className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-bold text-[var(--color-text)]">
                  Lien de réinitialisation envoyé
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Nous venons d'envoyer un email à{" "}
                  {emailSentTo ? (
                    <strong className="text-[var(--color-text)] font-semibold">{emailSentTo}</strong>
                  ) : (
                    "votre adresse"
                  )}
                  .
                </p>
                <p className="text-xs text-[var(--color-text-muted)] pt-1">
                  Cliquez sur le bouton dans l'email pour définir votre nouveau mot de passe. Le lien est valable pendant 1 heure.
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--color-border)]">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[var(--radius-button,12px)] bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour à la connexion</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Form State: Enter email to request reset link */
            <form action={requestPasswordReset} className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Votre adresse email"
                placeholder="jean.dupont@example.com"
                required
                autoFocus
                className="h-11"
              />

              {params?.message && (
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 text-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-[var(--radius-button,12px)]">
                  {params.message}
                </div>
              )}

              <OtpSubmitButton label="Envoyer le lien de réinitialisation" />

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
          )}
        </Card>
      </div>
    </div>
  )
}
