import { confirmSignUpOtp, resendSignUpOtp } from '../actions'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { OtpSubmitButton } from '@/components/auth/OtpSubmitButton'
import { AuthShell, authLinkClass } from '@/components/public/AuthShell'

export const metadata: Metadata = { title: 'Vérifiez votre email', robots: PRIVATE_PAGE_ROBOTS };
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

export default async function SignUpVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; message?: string; success?: string }>
}) {
  const params = await searchParams
  const email = params?.email || ''

  return (
    <AuthShell
      icon={Mail}
      title="Vérifiez votre email"
      description={
        <>
          Nous avons envoyé un code à 6 chiffres à{' '}
          <strong className="font-semibold text-text break-all">{email || 'votre adresse email'}</strong>.
        </>
      }
      footer={
        <Link href="/signup" className={authLinkClass}>
          <ArrowLeft className="h-4 w-4" />
          <span>Modifier mes informations</span>
        </Link>
      }
    >
      <form action={confirmSignUpOtp} className="space-y-5">
        <input type="hidden" name="email" value={email} />
        <div className="space-y-2">
          <label htmlFor="code" className="block text-sm font-semibold text-text">
            Code de confirmation
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
            aria-describedby="code-help"
            className="h-14 w-full rounded-[var(--radius-input)] border border-border bg-surface text-center font-mono text-2xl font-bold tracking-[0.5em] text-text transition-colors placeholder:text-text-muted/50 hover:border-border-hover focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p id="code-help" className="text-sm text-text-muted">
            Valable pendant 15 minutes.
          </p>
        </div>

        {params?.success && <Alert variant="success">{params.success}</Alert>}
        {params?.message && <Alert variant="danger">{params.message}</Alert>}

        <OtpSubmitButton label="Confirmer mon compte" />
      </form>

      <form action={resendSignUpOtp} className="mt-5 border-t border-border pt-5 text-center">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] px-3 text-sm font-semibold text-primary-ink transition-colors hover:bg-surface-hover"
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
          <span>Renvoyer un code</span>
        </button>
      </form>
    </AuthShell>
  )
}
