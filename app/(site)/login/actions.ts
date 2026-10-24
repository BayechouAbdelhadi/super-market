'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { resolveUserRole } from '@/lib/auth/roles'
import { RATE_LIMITS, getClientIp, rateLimitMessage } from '@/lib/security/rate-limit'
import { enforceRateLimits } from '@/lib/security/enforce'
import { NEXT_PARAM, safeNextPath } from '@/lib/auth/redirect'

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "L'adresse email est obligatoire."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
})

export type AuthActionResult = {
  success?: boolean
  error?: string | null
}

export async function login(
  prevStateOrFormData: AuthActionResult | FormData | null,
  maybeFormData?: FormData
): Promise<AuthActionResult> {
  const formData =
    prevStateOrFormData instanceof FormData
      ? prevStateOrFormData
      : maybeFormData instanceof FormData
      ? maybeFormData
      : null

  if (!formData) {
    return { error: "Données de formulaire manquantes." }
  }

  const parsed = LoginSchema.safeParse({
    email: formData.get('email') ?? '',
    password: formData.get('password') ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Données invalides." }
  }

  const { email, password } = parsed.data

  const ip = getClientIp(await headers())
  const limit = await enforceRateLimits([
    [`login:account:${email}`, RATE_LIMITS.loginPerAccount],
    [`login:ip:${ip}`, RATE_LIMITS.loginPerIp],
  ])
  if (!limit.allowed) {
    return { error: rateLimitMessage(limit) }
  }

  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Supabase Login Error:", error.message)
    if (error.message.includes('Invalid login credentials')) {
      return {
        error: "Adresse email ou mot de passe incorrect. Veuillez vérifier vos identifiants.",
      }
    }
    if (error.code === 'user_banned') {
      return { error: "Ce compte a été désactivé. Contactez un administrateur." }
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        error:
          "Votre adresse email n'a pas encore été confirmée. Veuillez vérifier votre boîte mail.",
      }
    }
    return {
      error: error.message || "Impossible de vous connecter. Veuillez réessayer.",
    }
  }

  const role = authData.user ? await resolveUserRole(supabase, authData.user) : 'CUSTOMER'

  let redirectPath: string
  if (role === 'ADMIN') {
    redirectPath = '/admin'
  } else if (role === 'CASHIER') {
    redirectPath = '/cashier'
  } else {
    // Back to the page that asked to log in (e.g. an arrival to reserve)
    redirectPath = safeNextPath(formData.get(NEXT_PARAM)) ?? '/account'
  }

  revalidatePath('/', 'layout')
  redirect(redirectPath)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // The shared site header shows the signed-in state: refresh it
  revalidatePath('/', 'layout')
  redirect('/login')
}
