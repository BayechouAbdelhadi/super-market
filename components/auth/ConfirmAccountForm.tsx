'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Lock, ArrowLeft, ShieldCheck } from 'lucide-react'
import { confirmAccount } from '@/app/confirm-account/actions'
import type { ConfirmAccountResult } from '@/app/confirm-account/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'

interface ConfirmAccountFormProps {
  email: string
  token: string
  role: 'CUSTOMER' | 'CASHIER' | 'ADMIN'
}

export function ConfirmAccountForm({ email, token, role }: ConfirmAccountFormProps) {
  const [state, formAction, isPending] = useActionState<ConfirmAccountResult, FormData>(
    confirmAccount,
    { error: null }
  )

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const errorMessage = state?.error

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage)
    }
  }, [errorMessage])

  const roleLabel = role === 'CASHIER' ? 'Caissier' : 'Client Fidélité'

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {/* Verified Account Notice */}
      <div className="text-xs font-medium text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-[var(--radius-button,12px)] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>
          Compte <strong>{roleLabel}</strong> vérifié
        </span>
      </div>

      {/* Pre-filled and Read-Only Email Field */}
      <div className="space-y-1.5">
        <Input
          id="email"
          name="email"
          type="email"
          label="Adresse email associée"
          value={email}
          readOnly
          tabIndex={-1}
          className="h-11 bg-[var(--color-surface-hover,#f7f7f7)] cursor-not-allowed font-medium text-[var(--color-text)] opacity-90 select-none"
          helperText="Cette adresse email est rattachée à votre compte et ne peut pas être modifiée."
          rightElement={<Lock className="w-4 h-4 text-[var(--color-text-muted)]" />}
        />
      </div>

      {/* New Password Field */}
      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Définir votre mot de passe"
        placeholder="••••••••"
        helperText="Au moins 6 caractères"
        required
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        className="h-11"
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors focus:outline-none"
            title={showPassword ? 'Masquer' : 'Afficher'}
            aria-label={showPassword ? 'Masquer' : 'Afficher'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      {/* Confirm Password Field */}
      <Input
        id="confirm_password"
        name="confirm_password"
        type={showConfirmPassword ? 'text' : 'password'}
        label="Confirmer votre mot de passe"
        placeholder="••••••••"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        className="h-11"
        rightElement={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors focus:outline-none"
            title={showConfirmPassword ? 'Masquer' : 'Afficher'}
            aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      {errorMessage && (
        <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 text-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-[var(--radius-button,12px)] animate-in fade-in">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        className="w-full font-bold shadow-[0_4px_14px_rgba(255,56,92,0.3)] mt-2"
      >
        {isPending ? 'Activation en cours...' : 'Confirmer et activer mon compte'}
      </Button>

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
  )
}
