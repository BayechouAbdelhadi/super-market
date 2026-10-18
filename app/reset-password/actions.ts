'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PENDING_RESET_COOKIE } from '@/lib/email/otp-security'
import { setPasswordFromToken } from '@/lib/auth/password-service'
import { PasswordSchema } from '@/lib/auth/password-rules'
import { z } from 'zod'

const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirm_password: z.string().min(1, "Veuillez confirmer votre mot de passe."),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm_password"],
  })

export async function resetPassword(formData: FormData) {
  const token = (formData.get('token') as string || '').trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  const parseResult = ResetPasswordSchema.safeParse({
    password,
    confirm_password: confirmPassword,
  })

  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues?.[0]?.message || "Données invalides."
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&message=${encodeURIComponent(errorMsg)}`
    )
  }

  // 1-3. Verify the signed, single-use reset token and update ONLY the account it names.
  // CRITICAL SECURITY: Never trust browser session cookies! The target email
  // MUST come strictly from the signed, HMAC-verified reset token.
  const cookieStore = await cookies()
  const rawToken = token || cookieStore.get(PENDING_RESET_COOKIE)?.value || ''
  const result = await setPasswordFromToken({
    flow: 'PASSWORD_RESET',
    token: rawToken,
    password: parseResult.data.password,
  })

  if (!result.ok) {
    switch (result.reason) {
      case 'EXPIRED':
        cookieStore.delete(PENDING_RESET_COOKIE)
        redirect(
          `/forgot-password?message=${encodeURIComponent(
            "Ce lien de réinitialisation a expiré. Veuillez refaire une nouvelle demande."
          )}`
        )
      case 'ALREADY_USED':
        cookieStore.delete(PENDING_RESET_COOKIE)
        redirect(
          `/forgot-password?message=${encodeURIComponent(
            "Ce lien de réinitialisation a déjà été utilisé. Veuillez refaire une nouvelle demande."
          )}`
        )
      case 'ACCOUNT_NOT_FOUND':
        console.error("[ResetPassword] No account found for signed email:", result.email)
        redirect(
          `/reset-password?message=${encodeURIComponent(
            `Aucun compte associé à l'adresse email ${result.email} n'a été trouvé.`
          )}`
        )
      case 'UPDATE_FAILED':
        console.error("[ResetPassword] admin.updateUserById error:", result.detail)
        redirect(
          `/reset-password?token=${encodeURIComponent(token)}&message=${encodeURIComponent(
            `Erreur lors de la mise à jour: ${result.detail}`
          )}`
        )
      case 'UNAVAILABLE':
        redirect(
          `/reset-password?token=${encodeURIComponent(token)}&message=${encodeURIComponent(
            "Service momentanément indisponible. Veuillez réessayer."
          )}`
        )
      default:
        redirect(
          `/reset-password?message=${encodeURIComponent(
            "Lien de réinitialisation invalide ou manquant. Veuillez refaire une demande."
          )}`
        )
    }
  }

  const targetEmail = result.email

  // 4. CRITICAL SECURITY: Immediately purge and sign out any active session in the browser!
  // If an admin or cashier was currently logged in on this browser window,
  // this completely wipes their session so no privilege escalation or cross-account leakage can occur.
  const supabase = await createClient()
  await supabase.auth.signOut().catch(() => null)
  cookieStore.delete(PENDING_RESET_COOKIE)

  // 5. Redirect cleanly to login
  redirect(
    `/login?success=${encodeURIComponent(
      `Le mot de passe pour le compte ${targetEmail} a été modifié avec succès ! Veuillez vous connecter avec vos nouveaux identifiants.`
    )}`
  )
}
