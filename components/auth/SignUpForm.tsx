'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { signup } from '@/app/signup/actions'
import type { SignUpActionResult } from '@/app/signup/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'

interface SignUpFormProps {
  initialMessage?: string
  initialData?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
}

export function SignUpForm({ initialMessage, initialData }: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState<SignUpActionResult, FormData>(
    signup,
    { error: initialMessage || null }
  )

  const [firstName, setFirstName] = useState(initialData?.firstName || '')
  const [lastName, setLastName] = useState(initialData?.lastName || '')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const errorMessage = state?.error

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state?.error])

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="first_name"
          name="first_name"
          type="text"
          label="Prénom"
          placeholder="Jean"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          className="h-11"
        />
        <Input
          id="last_name"
          name="last_name"
          type="text"
          label="Nom"
          placeholder="Dupont"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          className="h-11"
        />
      </div>

      <Input
        id="phone"
        name="phone"
        type="tel"
        label="Numéro de téléphone"
        placeholder="06 12 34 56 78"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
        className="h-11"
      />

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
        helperText="Au moins 6 caractères"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
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
        {isPending ? 'Création en cours...' : 'Créer mon compte'}
      </Button>

      <div className="pt-2 text-center border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)]">
          Déjà un compte ?{' '}
          <Link
            href="/login"
            className="font-bold text-[var(--color-primary)] hover:underline ml-1"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  )
}
