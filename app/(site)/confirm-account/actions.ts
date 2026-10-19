'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setPasswordFromToken } from '@/lib/auth/password-service'
import { PasswordSchema } from '@/lib/auth/password-rules'
import { z } from 'zod'

const ConfirmAccountSchema = z
  .object({
    password: PasswordSchema,
    confirm_password: z.string().min(1, "Veuillez confirmer votre mot de passe."),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm_password"],
  })

export type ConfirmAccountResult = {
  success?: boolean
  error?: string | null
}

export async function confirmAccount(
  prevStateOrFormData: ConfirmAccountResult | FormData | null,
  maybeFormData?: FormData
): Promise<ConfirmAccountResult> {
  const formData =
    prevStateOrFormData instanceof FormData
      ? prevStateOrFormData
      : maybeFormData instanceof FormData
      ? maybeFormData
      : null

  if (!formData) {
    return { error: "Données de formulaire manquantes." }
  }

  const token = ((formData.get('token') as string) || '').trim()
  const password = (formData.get('password') as string) || ''
  const confirmPassword = (formData.get('confirm_password') as string) || ''

  const parseResult = ConfirmAccountSchema.safeParse({
    password,
    confirm_password: confirmPassword,
  })

  if (!parseResult.success) {
    return {
      error: parseResult.error.issues?.[0]?.message || "Données invalides.",
    }
  }

  // 1-3. Verify the signed, single-use activation token, then set the password
  // and confirm ONLY the account named by the token.
  const result = await setPasswordFromToken({
    flow: 'ACCOUNT_ACTIVATION',
    token,
    password: parseResult.data.password,
  })

  if (!result.ok) {
    switch (result.reason) {
      case 'EXPIRED':
        return {
          error: "Ce lien d'activation a expiré. Veuillez contacter l'administrateur ou faire une demande de réinitialisation.",
        }
      case 'ALREADY_USED':
        return {
          error: "Ce lien d'activation a déjà été utilisé. Connectez-vous ou faites une demande de réinitialisation du mot de passe.",
        }
      case 'ACCOUNT_NOT_FOUND':
        console.error("[ConfirmAccount] Target user not found:", result.email)
        return {
          error: `Aucun compte associé à l'adresse email ${result.email} n'a été trouvé.`,
        }
      case 'UPDATE_FAILED':
        console.error("[ConfirmAccount] updateUserById error:", result.detail)
        return {
          error: `Erreur lors de la mise à jour : ${result.detail}`,
        }
      case 'UNAVAILABLE':
        return { error: "Service momentanément indisponible. Veuillez réessayer." }
      default:
        return {
          error: "Ce lien d'activation est invalide ou a expiré. Veuillez contacter le magasin.",
        }
    }
  }

  const targetEmail = result.email

  // 4. Purge any existing session in the browser to avoid session hijacking or privilege mismatch
  const supabase = await createClient()
  await supabase.auth.signOut().catch(() => null)

  // 5. Redirect to login with success message
  const roleName = result.role === 'CASHIER' ? 'caissier' : 'fidélité'
  redirect(
    `/login?success=${encodeURIComponent(
      `Votre compte ${roleName} (${targetEmail}) a été activé avec succès ! Connectez-vous avec votre nouveau mot de passe.`
    )}`
  )
}
