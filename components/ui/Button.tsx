import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  // Spacing & heights adhering to § 3, § 4, § 5 (min height ~44px for touch targets)
  const sizeClasses = {
    sm: "h-9 px-3.5 text-xs font-semibold rounded-[var(--radius-button,12px)]",
    md: "h-11 min-h-[44px] px-5 text-sm font-semibold rounded-[var(--radius-button,12px)]",
    lg: "h-12 min-h-[48px] px-6 text-base font-bold rounded-[var(--radius-button,12px)]",
  }[size];

  // Semantic styles adhering to § 5 & § 10
  const variantClasses = {
    primary:
      "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-text)] shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
    secondary:
      "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
    destructive:
      "bg-[var(--color-danger)] hover:bg-rose-700 text-white shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
    ghost:
      "bg-transparent hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50",
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${sizeClasses} ${variantClasses} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
