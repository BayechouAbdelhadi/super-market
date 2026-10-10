"use client"

import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group font-sans"
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--color-surface,#ffffff)] group-[.toaster]:text-[var(--color-text,#222222)] group-[.toaster]:border-[var(--color-border,#ebebeb)] group-[.toaster]:shadow-[var(--shadow-floating,0_4px_16px_rgba(0,0,0,0.08))] group-[.toaster]:rounded-[var(--radius-button,12px)] text-sm font-medium",
          description: "group-[.toast]:text-[var(--color-text-muted,#717171)] text-xs",
          actionButton:
            "group-[.toast]:bg-[var(--color-primary)] group-[.toast]:text-[var(--color-primary-text,#ffffff)] group-[.toast]:rounded-[var(--radius-button,12px)]",
          cancelButton:
            "group-[.toast]:bg-[var(--color-surface-hover,#f7f7f7)] group-[.toast]:text-[var(--color-text-muted)] group-[.toast]:rounded-[var(--radius-button,12px)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
