import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { cn } from "cn"

const alertVariants = cva(
  "flex items-start gap-3 rounded-[var(--radius-button)] border p-3 text-sm font-medium leading-relaxed",
  {
    variants: {
      variant: {
        success: "bg-success-subtle text-success-text border-success-border",
        danger: "bg-danger-subtle text-danger-text border-danger-border",
        info: "bg-info-subtle text-info-text border-info-border",
      },
    },
    defaultVariants: { variant: "info" },
  }
)

const ICONS = { success: CheckCircle2, danger: AlertCircle, info: Info } as const

export interface AlertProps extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {}

/** Inline feedback message (form result, link state). Errors are announced to screen readers. */
function Alert({ className, variant = "info", children, ...props }: AlertProps) {
  const Icon = ICONS[variant ?? "info"]
  return (
    <div
      data-slot="alert"
      role={variant === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export { Alert, alertVariants }
