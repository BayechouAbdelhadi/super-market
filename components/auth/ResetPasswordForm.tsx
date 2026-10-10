'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { resetPassword } from '@/app/reset-password/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PasswordCriteriaChecklist } from '@/components/auth/PasswordCriteriaChecklist'

interface ResetPasswordFormProps {
  email: string
  token: string
  errorMessage?: string
}

export function ResetPasswordForm({
  email,
  token,
  errorMessage,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <form
      action={(formData) => {
        setIsSubmitting(true)
        resetPassword(formData)
      }}
      className="space-y-4"
    >
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      {/* New Password */}
      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Nouveau mot de passe"
        placeholder="••••••••"
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

      <PasswordCriteriaChecklist password={password} />

      {/* Confirm Password */}
      <Input
        id="confirm_password"
        name="confirm_password"
        type={showConfirmPassword ? 'text' : 'password'}
        label="Confirmer le nouveau mot de passe"
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
        loading={isSubmitting}
        className="w-full font-bold shadow-[0_4px_14px_rgba(255,56,92,0.3)] mt-2"
      >
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer mon nouveau mot de passe'}
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
