import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center gap-1 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-on-color border-transparent",
        secondary:
          "bg-[var(--color-surface-hover)] text-[var(--color-text)] border-[var(--color-border)]",
        destructive:
          "bg-danger-subtle text-danger-text border-danger-border",
        danger:
          "bg-danger-subtle text-danger-text border-danger-border",
        outline:
          "border-[var(--color-border)] text-[var(--color-text)]",
        success:
          "bg-success-subtle text-success-text border-success-border",
        warning:
          "bg-warning-subtle text-warning-text border-warning-border",
        info:
          "bg-info-subtle text-info-text border-info-border",
        brand:
          "bg-[var(--color-primary)] text-on-color border-transparent",
        neutral:
          "bg-surface-hover text-[var(--color-text)] border-[var(--color-border)]",
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
