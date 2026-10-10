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
      className="w-full font-bold shadow-[0_4px_14px_rgba(255,56,92,0.3)]"
    >
      {pending ? "Vérification en cours..." : label}
    </Button>
  )
}
