'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/loyalty/domain'
import { z } from 'zod'

const SignUpSchema = z.object({
  first_name: z.string().trim().min(2, "Le prénom doit comporter au moins 2 caractères."),
  last_name: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères."),
  email: z.string().trim().email("Adresse email invalide."),
  phone: z.string().trim().min(8, "Le numéro de téléphone doit comporter au moins 8 caractères."),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères."),
})

export async function signup(formData: FormData) {
  const rawData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    password: formData.get('password') as string,
  }

  const parseResult = SignUpSchema.safeParse(rawData)
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues?.[0]?.message || "Données invalides."
    redirect(`/signup?message=${encodeURIComponent(errorMsg)}`)
  }

  const { first_name, last_name, email, phone, password } = parseResult.data
  const phoneNormalized = normalizePhone(phone)
  const emailNormalized = email.toLowerCase().trim()
  const firstNameClean = first_name.trim()
  const lastNameClean = last_name.trim()

  // STRICT INVARIANT:
  // Public signup is strictly locked to role 'CUSTOMER'.
  // Under NO circumstances can 'ADMIN' or 'CASHIER' ever be created here.
  const STRICT_ROLE = 'CUSTOMER' as const

  const supabase = await createClient()

  // Check if profile with email or phone already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .or(`email.eq.${emailNormalized},phone_number.eq.${phoneNormalized}`)
    .limit(1)

  if (existingUser && existingUser.length > 0) {
    redirect(`/signup?message=${encodeURIComponent("Un compte avec cet email ou numéro de téléphone existe déjà.")}`)
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: emailNormalized,
    password,
    options: {
      data: {
        first_name: firstNameClean,
        last_name: lastNameClean,
        phone_number: phoneNormalized,
        role: STRICT_ROLE, // IMMUTABLE: ONLY role CUSTOMER
      },
    },
  })

  if (authError || !authData.user) {
    console.error("[SignUp Error]", authError?.message)
    redirect(`/signup?message=${encodeURIComponent(authError?.message || "Erreur lors de la création du compte.")}`)
  }

  const userId = authData.user.id

  // Create profile with hardcoded role CUSTOMER
  await supabase.from('profiles').upsert({
    id: userId,
    first_name: firstNameClean,
    last_name: lastNameClean,
    email: emailNormalized,
    phone_number: phoneNormalized,
    role: STRICT_ROLE, // IMMUTABLE: ONLY role CUSTOMER
  })

  // Create initial loyalty customer record (Bronze tier, 0 points)
  await supabase.from('customers').upsert({
    id: userId,
    loyalty_points: 0,
    status: 'BRONZE',
  })

  if (authData.session) {
    redirect('/account')
  }

  redirect(`/login?success=${encodeURIComponent("Votre compte client a été créé avec succès ! Vous pouvez vous connecter.")}`)
}
