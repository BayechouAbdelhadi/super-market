'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  const password = (formData.get('password') as string) || ''

  if (!email) {
    return { error: "L'adresse email est obligatoire." }
  }

  if (!password) {
    return { error: "Le mot de passe est obligatoire." }
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

  const role = authData.user?.user_metadata?.role || 'CUSTOMER'

  let redirectPath: string
  if (role === 'ADMIN') {
    redirectPath = '/admin'
  } else if (role === 'CASHIER') {
    redirectPath = '/cashier'
  } else {
    redirectPath = '/account'
  }

  revalidatePath(redirectPath, 'layout')
  redirect(redirectPath)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
