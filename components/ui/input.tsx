import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  helperText?: string
  error?: string
}

function Input({
  className,
  type,
  label,
  helperText,
  error,
  id,
  disabled,
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
        error && "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]",
        className
      )}
      {...props}
    />
  )

  if (!label && !helperText && !error) {
    return inputElement
  }

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[var(--color-text)] tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {inputElement}
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
