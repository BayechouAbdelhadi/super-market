'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
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

  const supabase = await createClient()

  // 1. If an active authenticated session exists in cookies (e.g. from Supabase link or exchange)
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

    // A. Try updating via Supabase Admin API if SUPABASE_SERVICE_ROLE_KEY is configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      try {
        const { createClient: createSupabaseJsClient } = await import('@supabase/supabase-js')
        const adminClient = createSupabaseJsClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { auth: { persistSession: false, autoRefreshToken: false } }
        )

        const { data: profile } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', pendingData.email)
          .single()

        if (profile?.id) {
          const { error: adminError } = await adminClient.auth.admin.updateUserById(profile.id, {
            password: parseResult.data.password,
          })

          if (!adminError) {
            cookieStore.delete(PENDING_RESET_COOKIE)
            redirect(
              `/login?success=${encodeURIComponent(
                "Votre mot de passe a été modifié avec succès ! Vous pouvez maintenant vous connecter."
              )}`
            )
          }
        }
      } catch (e) {
        console.error("[ResetPassword] Service role update exception:", e)
      }
    }

    // B. Try direct database RPC if available in Postgres
    const { data: rpcData, error: rpcError } = await supabase.rpc('reset_customer_password', {
      user_email: pendingData.email,
      new_password: parseResult.data.password,
    })

    if (!rpcError && (rpcData as any)?.success) {
      cookieStore.delete(PENDING_RESET_COOKIE)
      redirect(
        `/login?success=${encodeURIComponent(
          "Votre mot de passe a été modifié avec succès ! Vous pouvez maintenant vous connecter."
        )}`
      )
    }
  }

  // 3. If neither session nor service role / RPC succeeded
  console.error("[ResetPassword] Password update could not be completed for:", emailParam)
  redirect(
    `/reset-password?email=${encodeURIComponent(emailParam)}&token=${encodeURIComponent(token)}&message=${encodeURIComponent(
      "Impossible de mettre à jour le mot de passe. Veuillez refaire une demande ou contacter le support."
    )}`
  )
}
