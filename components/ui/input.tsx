import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  helperText?: string
  error?: string
  rightElement?: React.ReactNode
}

function Input({
  className,
  type,
  label,
  helperText,
  error,
  id,
  disabled,
  rightElement,
  ...props
}: InputProps) {
  const generatedId = React.useId()
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : generatedId)

  const inputElement = (
    <InputPrimitive
      id={inputId}
      type={type}
      disabled={disabled}
      data-slot="input"
      className={cn(
        "h-11 min-h-[44px] w-full min-w-0 rounded-[var(--radius-input,12px)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] transition-all duration-150 outline-none placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        rightElement && "pr-10",
        error && "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]",
        className
      )}
      {...props}
    />
  )

  if (!label && !helperText && !error) {
    if (rightElement) {
      return (
        <div className="relative w-full">
          {inputElement}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        </div>
      )
    }
    return inputElement
  }

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text)] tracking-wide"
        >
          <span>{label}</span>
          {props.required && !label.trim().endsWith('*') && (
            <span
              className="text-[var(--color-danger,#e11d48)] font-bold text-sm leading-none"
              title="Champ obligatoire"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}
      <div className="relative w-full">
        {inputElement}
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-[var(--color-danger)] animate-in fade-in duration-150">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      ) : null}
    </div>
  )
}

export { Input }
