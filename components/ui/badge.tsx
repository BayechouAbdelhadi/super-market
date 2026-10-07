import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center gap-1 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-white border-transparent",
        secondary:
          "bg-[var(--color-surface-hover)] text-[var(--color-text)] border-[var(--color-border)]",
        destructive:
          "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        danger:
          "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        outline:
          "border-[var(--color-border)] text-[var(--color-text)]",
        success:
          "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        warning:
          "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        brand:
          "bg-[var(--color-primary)] text-white border-transparent",
        neutral:
          "bg-zinc-100 dark:bg-zinc-800 text-[var(--color-text)] border-[var(--color-border)]",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        default: "px-2.5 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs font-semibold",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant,
  size,
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
