'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifySignedToken,
  AccountActivationPayload,
} from '@/lib/email/otp-security'
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

  // 1. Verify cryptographic token
  const payload = token ? verifySignedToken<AccountActivationPayload>(token) : null

  if (!payload || payload.type !== 'ACCOUNT_ACTIVATION') {
    return {
      error: "Ce lien d'activation est invalide ou a expiré. Veuillez contacter le magasin.",
    }
  }

  if (Date.now() > payload.expiresAt) {
    return {
      error: "Ce lien d'activation a expiré. Veuillez contacter l'administrateur ou faire une demande de réinitialisation.",
    }
  }

  const targetEmail = payload.email.toLowerCase().trim()

  // 2. Locate user strictly by token email
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
    const { data: usersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 })
    const matched = usersData?.users?.find(
      (u) => u.email?.toLowerCase().trim() === targetEmail
    )
    targetUserId = matched?.id || null
  }

  if (!targetUserId) {
    console.error("[ConfirmAccount] Target user not found:", targetEmail)
    return {
      error: `Aucun compte associé à l'adresse email ${targetEmail} n'a été trouvé.`,
    }
  }

  // 3. Update password and confirm user
  const { error: adminError } = await adminClient.auth.admin.updateUserById(targetUserId, {
    password: parseResult.data.password,
    email_confirm: true,
  })

  if (adminError) {
    console.error("[ConfirmAccount] updateUserById error:", adminError.message)
    return {
      error: `Erreur lors de la mise à jour : ${adminError.message}`,
    }
  }

  // 4. Purge any existing session in the browser to avoid session hijacking or privilege mismatch
  const supabase = await createClient()
  await supabase.auth.signOut().catch(() => null)

  // 5. Redirect to login with success message
  const roleName = payload.role === 'CASHIER' ? 'caissier' : 'fidélité'
  redirect(
    `/login?success=${encodeURIComponent(
      `Votre compte ${roleName} (${targetEmail}) a été activé avec succès ! Connectez-vous avec votre nouveau mot de passe.`
    )}`
  )
}
