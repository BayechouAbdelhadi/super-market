'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifySignedToken,
  PENDING_RESET_COOKIE,
  PendingResetPayload,
} from '@/lib/email/otp-security'
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

  // 1. Verify the cryptographically signed reset token
  // CRITICAL SECURITY: Never trust browser session cookies! The target email
  // MUST come strictly from the signed, HMAC-verified reset token.
  const cookieStore = await cookies()
  const rawToken = token || cookieStore.get(PENDING_RESET_COOKIE)?.value
  const pendingData = rawToken ? verifySignedToken<PendingResetPayload>(rawToken) : null

  if (!pendingData) {
    redirect(
      `/reset-password?message=${encodeURIComponent(
        "Lien de réinitialisation invalide ou manquant. Veuillez refaire une demande."
      )}`
    )
  }

  if (Date.now() > pendingData.expiresAt) {
    cookieStore.delete(PENDING_RESET_COOKIE)
    redirect(
      `/forgot-password?message=${encodeURIComponent(
        "Ce lien de réinitialisation a expiré. Veuillez refaire une nouvelle demande."
      )}`
    )
  }

  const targetEmail = pendingData.email.toLowerCase().trim()

  // 2. Identify the target user strictly by the signed token email
  const adminClient = createAdminClient()
  let targetUserId: string | null = null

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', targetEmail)
    .single()

  if (profile?.id) {
    targetUserId = profile.id
  } else {
    // Fallback search in auth users list
    const { data: usersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 })
    const matched = usersData?.users?.find(
      (u) => u.email?.toLowerCase().trim() === targetEmail
    )
    targetUserId = matched?.id || null
  }

  if (!targetUserId) {
    console.error("[ResetPassword] No account found for signed email:", targetEmail)
    redirect(
      `/reset-password?message=${encodeURIComponent(
        `Aucun compte associé à l'adresse email ${targetEmail} n'a été trouvé.`
      )}`
    )
  }

  // 3. Update the target user's password using the Admin Client
  // This explicitly targets ONLY the user from the signed token, NEVER the browser's active session!
  const { error: adminError } = await adminClient.auth.admin.updateUserById(targetUserId, {
    password: parseResult.data.password,
  })

  if (adminError) {
    console.error("[ResetPassword] admin.updateUserById error:", adminError.message)
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&message=${encodeURIComponent(
        `Erreur lors de la mise à jour: ${adminError.message}`
      )}`
    )
  }

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
