'use client'

import { useMemo } from 'react'
import { Check, Circle } from 'lucide-react'
import { evaluatePasswordCriteria } from '@/lib/auth/password-rules'

interface PasswordCriteriaChecklistProps {
  password: string
  /**
   * Only show checklist once user has started typing, or always.
   * Defaults to false (always visible or visible when typing).
   */
  alwaysVisible?: boolean
}

export function PasswordCriteriaChecklist({
  password,
  alwaysVisible = false,
}: PasswordCriteriaChecklistProps) {
  const { results, metCount, totalCount, isComplete } = useMemo(
    () => evaluatePasswordCriteria(password),
    [password]
  )

  const hasStartedTyping = (password || '').length > 0

  // Don't clutter UI before user starts typing unless alwaysVisible is true
  if (!alwaysVisible && !hasStartedTyping) {
    return null
  }

  // Progress color based on score
  const progressPercent = Math.round((metCount / totalCount) * 100)
  const strengthColor =
    metCount <= 2
      ? 'bg-danger'
      : metCount < 5
      ? 'bg-warning'
      : 'bg-success'

  const strengthLabel =
    metCount === 0
      ? 'Très faible'
      : metCount <= 2
      ? 'Faible'
      : metCount <= 4
      ? 'Moyen'
      : 'Robuste'

  return (
    <div className="space-y-2 p-2.5 rounded-[var(--radius-button,12px)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs animate-in fade-in duration-200">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px] font-medium text-[var(--color-text-muted)]">
          <span>Sécurité du mot de passe :</span>
          <span
            className={
              isComplete
                ? 'font-bold text-success-text'
                : metCount >= 3
                ? 'font-semibold text-warning-text'
                : 'font-semibold text-danger-text'
            }
          >
            {strengthLabel} ({metCount}/{totalCount})
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${strengthColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Criteria Checklist (2-column on wider screens) */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 pt-1.5 border-t border-[var(--color-border)]/50">
        {results.map((criterion) => {
          const satisfied = criterion.satisfied
          return (
            <li
              key={criterion.id}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                satisfied
                  ? 'text-success-text font-medium'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  satisfied
                    ? 'bg-success-subtle text-success-text'
                    : 'text-[var(--color-text-muted)]/40'
                }`}
              >
                {satisfied ? (
                  <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                ) : (
                  <Circle className="w-2 h-2 fill-current" />
                )}
              </span>
              <span className="text-[11px] leading-tight truncate" title={criterion.label}>
                {criterion.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
