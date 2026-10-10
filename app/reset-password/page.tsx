import { resetPassword } from './actions'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { OtpSubmitButton } from '@/components/auth/OtpSubmitButton'
import { ResetPasswordHashHandler } from '@/components/auth/ResetPasswordHashHandler'
import { ArrowLeft, KeyRound } from 'lucide-react'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string
    message?: string
    code?: string
    token?: string
    token_hash?: string
    type?: string
  }>
}) {
  const params = await searchParams
  const code = params?.code?.trim()
  const tokenHash = params?.token_hash?.trim()
  const token = params?.token?.trim()
  const email = params?.email?.trim() || ''
  const type = params?.type?.trim() || 'recovery'

  // If the URL query contains an auth code or token_hash from Supabase,
  // exchange it via /auth/callback to establish an authenticated session immediately.
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/reset-password`)
  }

  if (tokenHash) {
    redirect(
      `/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=/reset-password`
    )
  }

  // Check if session is already active
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-4 sm:p-6 font-sans">
      {/* Listens for hash-based tokens (#access_token=...) from Supabase Implicit grant */}
      <ResetPasswordHashHandler />

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
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xs mx-auto">
            Définissez votre nouveau mot de passe pour accéder à votre compte.
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[var(--color-border)]">
          <form action={resetPassword} className="space-y-4">
            <input type="hidden" name="email" value={email || user?.email || ''} />
            <input type="hidden" name="token" value={token || ''} />

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
