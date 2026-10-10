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
import { z } from 'zod'

const ResetPasswordSchema = z
  .object({
    password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères."),
    confirm_password: z.string().min(6, "Veuillez confirmer votre mot de passe."),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm_password"],
  })

export async function resetPassword(formData: FormData) {
  const token = (formData.get('token') as string || '').trim()
  const emailParam = (formData.get('email') as string || '').trim().toLowerCase()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  const parseResult = ResetPasswordSchema.safeParse({
    password,
    confirm_password: confirmPassword,
  })

  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues?.[0]?.message || "Données invalides."
    redirect(
      `/reset-password?email=${encodeURIComponent(emailParam)}&token=${encodeURIComponent(token)}&message=${encodeURIComponent(errorMsg)}`
    )
  }

  // 1. If an active authenticated session exists in cookies (e.g. from native Supabase recovery link)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { error: updateError } = await supabase.auth.updateUser({
      password: parseResult.data.password,
    })

    if (!updateError) {
      const cookieStore = await cookies()
      cookieStore.delete(PENDING_RESET_COOKIE)
      redirect(
        `/login?success=${encodeURIComponent(
          "Votre mot de passe a été modifié avec succès ! Vous pouvez maintenant vous connecter."
        )}`
      )
    }

    console.error("[ResetPassword] updateUser error with active session:", updateError.message)
    redirect(
      `/reset-password?email=${encodeURIComponent(emailParam)}&token=${encodeURIComponent(token)}&message=${encodeURIComponent(
        `Erreur: ${updateError.message}`
      )}`
    )
  }

  // 2. Validate signed reset token from the URL query
  const cookieStore = await cookies()
  const rawToken = token || cookieStore.get(PENDING_RESET_COOKIE)?.value
  const pendingData = rawToken ? verifySignedToken<PendingResetPayload>(rawToken) : null

  if (pendingData) {
    if (Date.now() > pendingData.expiresAt) {
      cookieStore.delete(PENDING_RESET_COOKIE)
      redirect(
        `/forgot-password?message=${encodeURIComponent(
          "Ce lien de réinitialisation a expiré. Veuillez refaire une nouvelle demande."
        )}`
      )
    }

    // Update password securely via Server-Only Supabase Admin Client
    try {
      const adminClient = createAdminClient()

      let targetUserId: string | null = null
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', pendingData.email)
        .single()

      if (profile?.id) {
        targetUserId = profile.id
      } else {
        const { data: usersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 })
        const userFound = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === pendingData.email.toLowerCase()
        )
        targetUserId = userFound?.id || null
      }

      if (!targetUserId) {
        console.error("[ResetPassword] User not found for email:", pendingData.email)
        redirect(
          `/reset-password?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent(
            "Aucun compte associé à cette adresse email n'a été trouvé."
          )}`
        )
      }

      const { error: adminError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: parseResult.data.password,
      })

      if (adminError) {
        console.error("[ResetPassword] admin.updateUserById error:", adminError.message)
        redirect(
          `/reset-password?email=${encodeURIComponent(pendingData.email)}&token=${encodeURIComponent(token)}&message=${encodeURIComponent(
            `Erreur: ${adminError.message}`
          )}`
        )
      }

      // Password successfully updated!
      cookieStore.delete(PENDING_RESET_COOKIE)
      redirect(
        `/login?success=${encodeURIComponent(
          "Votre mot de passe a été modifié avec succès ! Vous pouvez maintenant vous connecter."
        )}`
      )
    } catch (err) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        throw err
      }
      console.error("[ResetPassword] Unexpected error during admin update:", err)
    }
  }

  // 3. Fallback error if token was missing or invalid
  redirect(
    `/reset-password?email=${encodeURIComponent(emailParam)}&token=${encodeURIComponent(token)}&message=${encodeURIComponent(
      "Session de réinitialisation expirée ou invalide. Veuillez refaire une demande."
    )}`
  )
}
