'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { login } from '@/app/(site)/login/actions'
import type { AuthActionResult } from '@/app/(site)/login/actions'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'

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

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state?.error])

  useEffect(() => {
    if (initialSuccess) {
      toast.success(initialSuccess)
    }
  }, [initialSuccess])

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
          className="text-sm font-medium text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline transition-colors"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      {initialSuccess && !errorMessage && (
        <Alert variant="success">{initialSuccess}</Alert>
      )}

      {errorMessage && (
        <Alert variant="danger">{errorMessage}</Alert>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        className="w-full font-bold"
      >
        {isPending ? 'Connexion en cours...' : 'Se connecter'}
      </Button>

      <div className="pt-5 text-center border-t border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-muted)]">
          Pas encore de compte client ?{' '}
          <Link
            href="/signup"
            className="font-semibold text-primary-ink underline-offset-4 hover:underline ml-1"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </form>
  )
}
