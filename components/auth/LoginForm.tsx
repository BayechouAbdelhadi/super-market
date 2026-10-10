'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { login } from '@/app/login/actions'
import type { AuthActionResult } from '@/app/login/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface LoginFormProps {
  initialMessage?: string
  initialSuccess?: string
}

export function LoginForm({ initialMessage, initialSuccess }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    login,
    { error: initialMessage || null }
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const errorMessage = state?.error

  return (
    <form action={formAction} className="space-y-5">
      <Input
        id="email"
        name="email"
        type="email"
        label="Adresse email"
        placeholder="email@gmail.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        className="h-11"
      />

      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Mot de passe"
        placeholder="••••••••"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        className="h-11"
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors focus:outline-none"
            title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      <div className="flex justify-end -mt-2">
        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      {initialSuccess && !errorMessage && (
        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-center bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-[var(--radius-button,12px)] animate-in fade-in">
          {initialSuccess}
        </div>
      )}

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
        className="w-full font-bold shadow-[0_4px_14px_rgba(255,56,92,0.3)]"
      >
        {isPending ? 'Connexion en cours...' : 'Se connecter'}
      </Button>

      <div className="pt-2 text-center border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)]">
          Pas encore de compte client ?{' '}
          <Link
            href="/signup"
            className="font-bold text-[var(--color-primary)] hover:underline ml-1"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </form>
  )
}
