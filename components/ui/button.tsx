import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-button,12px)] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-text)] shadow-xs",
        primary:
          "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-text)] shadow-xs",
        secondary:
          "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-border-hover)] shadow-2xs",
        destructive:
          "bg-[var(--color-danger)] hover:opacity-90 text-white shadow-xs",
        ghost:
          "bg-transparent hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
        outline:
          "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
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
