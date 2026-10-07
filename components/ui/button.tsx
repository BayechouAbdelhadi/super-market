import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-button,12px)] border border-transparent bg-clip-padding text-sm font-semibold tracking-tight whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-text)] shadow-[0_2px_8px_0_rgba(255,56,92,0.25)] hover:shadow-[0_4px_16px_0_rgba(255,56,92,0.35)] hover:-translate-y-[0.5px] active:translate-y-0 active:scale-[0.98]",
        primary:
          "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-text)] shadow-[0_2px_8px_0_rgba(255,56,92,0.25)] hover:shadow-[0_4px_16px_0_rgba(255,56,92,0.35)] hover:-translate-y-[0.5px] active:translate-y-0 active:scale-[0.98]",
        secondary:
          "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_0_rgba(0,0,0,0.06)] active:scale-[0.98]",
        destructive:
          "bg-[var(--color-danger)] hover:opacity-95 text-white shadow-[0_2px_8px_rgba(193,53,21,0.25)] active:scale-[0.98]",
        ghost:
          "bg-transparent hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-[0.98]",
        outline:
          "border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] hover:border-[var(--color-border-hover)] active:scale-[0.98]",
        link: "text-[var(--color-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 min-h-[44px] px-5 text-sm",
        md: "h-11 min-h-[44px] px-5 text-sm",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 min-h-[48px] px-6 text-base font-bold",
        icon: "size-11 min-h-[44px] min-w-[44px]",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {
  fullWidth?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  fullWidth = false,
  type,
  ...props
}: ButtonProps) {
  const resolvedType = type ?? (props.formAction ? "submit" : undefined);
  return (
    <ButtonPrimitive
      data-slot="button"
      type={resolvedType}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants }
