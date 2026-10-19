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
            "group toast group-[.toaster]:bg-[var(--color-surface)] group-[.toaster]:text-[var(--color-text)] group-[.toaster]:border-[var(--color-border)] group-[.toaster]:shadow-[var(--shadow-floating,0_4px_16px_rgba(0,0,0,0.08))] group-[.toaster]:rounded-[var(--radius-button,12px)] text-sm font-medium",
          description: "group-[.toast]:text-[var(--color-text-muted)] text-xs",
          actionButton:
            "group-[.toast]:bg-[var(--color-primary)] group-[.toast]:text-[var(--color-primary-text)] group-[.toast]:rounded-[var(--radius-button,12px)]",
          cancelButton:
            "group-[.toast]:bg-[var(--color-surface-hover)] group-[.toast]:text-[var(--color-text-muted)] group-[.toast]:rounded-[var(--radius-button,12px)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
