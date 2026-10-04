import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Input({
  label,
  helperText,
  error,
  id,
  className = "",
  disabled,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

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
        <input
          id={inputId}
          disabled={disabled}
          className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm sm:text-base rounded-[var(--radius-input,12px)] border transition-all duration-150 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 ${
            error
              ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
              : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs font-medium text-[var(--color-danger)] animate-in fade-in duration-150">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      ) : null}
    </div>
  );
}
