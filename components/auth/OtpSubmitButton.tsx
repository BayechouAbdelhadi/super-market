"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export function OtpSubmitButton({ label = "Confirmer mon compte" }: { label?: string }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      loading={pending}
      className="w-full font-bold shadow-[var(--shadow-primary-glow)]"
    >
      {pending ? "Vérification en cours..." : label}
    </Button>
  )
}
