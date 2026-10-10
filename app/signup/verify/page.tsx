import { confirmSignUpOtp, resendSignUpOtp } from '../actions'
import Image from 'next/image'
import Link from 'next/link'
import { OtpSubmitButton } from '@/components/auth/OtpSubmitButton'
import { Card } from '@/components/ui/card'
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react'

export default async function SignUpVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; message?: string; success?: string }>
}) {
  const params = await searchParams
  const email = params?.email || ''

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
            Vérifiez votre email
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xs mx-auto">
            Nous avons envoyé un code de confirmation à 6 chiffres à{" "}
            <span className="font-semibold text-[var(--color-text)] break-all">{email || "votre adresse email"}</span>
          </p>
        </div>

        {/* Verification Card */}
        <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
          <form action={confirmSignUpOtp} className="space-y-5">
            <input type="hidden" name="email" value={email} />

            <div className="space-y-2 text-center">
              <label
                htmlFor="code"
                className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block"
              >
                Code de confirmation (6 chiffres)
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                required
                autoFocus
                autoComplete="one-time-code"
                className="w-full h-14 text-center text-2xl sm:text-3xl font-extrabold tracking-[10px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-mono"
              />
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Valable pendant 15 minutes
              </p>
            </div>

            {params?.success && (
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-center bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-[var(--radius-button,12px)]">
                {params.success}
              </div>
            )}

            {params?.message && (
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 text-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-[var(--radius-button,12px)]">
                {params.message}
              </div>
            )}

            <OtpSubmitButton label="Confirmer mon compte" />
          </form>

          {/* Resend Action */}
          <div className="pt-4 mt-4 border-t border-[var(--color-border)] text-center">
            <form action={resendSignUpOtp} className="inline-block">
              <input type="hidden" name="email" value={email} />
              <button
                type="submit"
                className="text-xs font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renvoyer un nouveau code</span>
              </button>
            </form>
          </div>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/signup"
            className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Modifier mes informations</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
