import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "brand";
  size?: "sm" | "md";
}

export function Badge({
  variant = "neutral",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs font-semibold",
  }[size];

  const variantClasses = {
    neutral:
      "bg-zinc-100 dark:bg-zinc-800 text-[var(--color-text)] border border-[var(--color-border)]",
    success:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    warning:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    danger:
      "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
    brand:
      "bg-[var(--color-primary)] text-white border border-transparent",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full tracking-wide transition-colors ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
