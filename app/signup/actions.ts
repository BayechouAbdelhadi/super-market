'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/loyalty/domain'
import { emailService } from '@/lib/email'
import {
  generateSecureOtp,
  hashOtp,
  createSignedToken,
  verifySignedToken,
  PENDING_SIGNUP_COOKIE,
} from '@/lib/email/otp-security'
import { z } from 'zod'

export type SignUpActionResult = {
  success?: boolean
  error?: string | null
}

const SignUpSchema = z.object({
  first_name: z.string().trim().min(2, "Le prénom est obligatoire (au moins 2 caractères)."),
  last_name: z.string().trim().min(2, "Le nom est obligatoire (au moins 2 caractères)."),
  email: z.string().trim().email("L'adresse email est obligatoire et doit être valide."),
  phone: z.string().trim().min(8, "Le numéro de téléphone est obligatoire (au moins 8 chiffres)."),
  password: z.string().min(6, "Le mot de passe est obligatoire (au moins 6 caractères)."),
})

interface PendingSignUpPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  otpHash: string;
  expiresAt: number;
}

/**
 * Step 1: User submits signup details.
 * Validates inputs, generates a 6-digit confirmation OTP,
 * sends it via Brevo email service, and redirects to OTP verification.
 */
export async function signup(
  prevStateOrFormData: SignUpActionResult | FormData | null,
  maybeFormData?: FormData
): Promise<SignUpActionResult> {
  const formData =
    prevStateOrFormData instanceof FormData
      ? prevStateOrFormData
      : maybeFormData instanceof FormData
      ? maybeFormData
      : null

  if (!formData) {
    return { error: "Données de formulaire manquantes." }
  }

  const rawData = {
    first_name: ((formData.get('first_name') as string) || '').trim(),
    last_name: ((formData.get('last_name') as string) || '').trim(),
    email: ((formData.get('email') as string) || '').trim(),
    phone: ((formData.get('phone') as string) || '').trim(),
    password: (formData.get('password') as string) || '',
  }

  const parseResult = SignUpSchema.safeParse(rawData)
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues?.[0]?.message || "Données invalides."
    return { error: errorMsg }
  }

  const { first_name, last_name, email, phone, password } = parseResult.data
  const phoneNormalized = normalizePhone(phone)
  const emailNormalized = email.toLowerCase().trim()
  const firstNameClean = first_name.trim()
  const lastNameClean = last_name.trim()

  const supabase = await createClient()

  // Verify that account does not already exist
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id, email, phone_number')
    .or(`email.eq.${emailNormalized},phone_number.eq.${phoneNormalized}`)
    .limit(1)

  if (existingUser && existingUser.length > 0) {
    const isEmailConflict = existingUser[0].email?.toLowerCase() === emailNormalized
    return {
      error: isEmailConflict
        ? "Un compte existe déjà avec cette adresse email."
        : "Un compte existe déjà avec ce numéro de téléphone.",
    }
  }

  // Generate 6-digit cryptographically secure OTP
  const otp = generateSecureOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Send confirmation OTP email via Brevo
  const emailResult = await emailService.sendVerificationOtp({
    email: emailNormalized,
    name: `${firstNameClean} ${lastNameClean}`,
    otp,
    expiresInMinutes: 15,
  });

  if (!emailResult.success) {
    console.error("[SignUp] Failed to send Brevo verification email:", emailResult.error);
    return {
      error: "Impossible d'envoyer l'email de confirmation. Veuillez vérifier votre adresse email et réessayer.",
    }
  }

  // Store secure signed token in HTTP-only cookie
  const payload: PendingSignUpPayload = {
    first_name: firstNameClean,
    last_name: lastNameClean,
    email: emailNormalized,
    phone: phoneNormalized,
    password,
    otpHash,
    expiresAt,
  };

  const signedToken = createSignedToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(PENDING_SIGNUP_COOKIE, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 mins
    path: '/',
  });

  redirect(`/signup/verify?email=${encodeURIComponent(emailNormalized)}`)
}

/**
 * Step 2: User enters the 6-digit confirmation OTP.
 * Verifies code, creates user in Supabase with STRICT role 'CUSTOMER'.
 */
export async function confirmSignUpOtp(formData: FormData) {
  const code = (formData.get('code') as string || '').trim();
  const emailParam = (formData.get('email') as string || '').trim();

  if (!code || code.length !== 6) {
    redirect(`/signup/verify?email=${encodeURIComponent(emailParam)}&message=${encodeURIComponent("Veuillez saisir un code à 6 chiffres valide.")}`)
  }

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(PENDING_SIGNUP_COOKIE)?.value;

  if (!rawToken) {
    redirect(`/signup?message=${encodeURIComponent("Session de confirmation expirée. Veuillez recommencer.")}`)
  }

  const pendingData = verifySignedToken<PendingSignUpPayload>(rawToken);
  if (!pendingData) {
    redirect(`/signup?message=${encodeURIComponent("Jeton de confirmation invalide. Veuillez recommencer.")}`)
  }

  if (Date.now() > pendingData.expiresAt) {
    cookieStore.delete(PENDING_SIGNUP_COOKIE);
    redirect(`/signup?message=${encodeURIComponent("Le code de confirmation a expiré. Veuillez vous réinscrire.")}`)
  }

  // Verify OTP hash
  const inputHash = hashOtp(code);
  if (inputHash !== pendingData.otpHash) {
    redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent("Code de confirmation incorrect. Veuillez vérifier vos emails.")}`)
  }

  // STRICT SECURITY INVARIANT:
  // Public signup is strictly locked to role 'CUSTOMER'.
  // Under NO circumstances can 'ADMIN' or 'CASHIER' ever be created here.
  const STRICT_ROLE = 'CUSTOMER' as const;

  const adminClient = createAdminClient();

  // Create confirmed user in Supabase (Brevo OTP has already been verified)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: pendingData.email,
    password: pendingData.password,
    email_confirm: true, // Marked as verified immediately
    user_metadata: {
      first_name: pendingData.first_name,
      last_name: pendingData.last_name,
      phone_number: pendingData.phone,
      role: STRICT_ROLE,
    },
  });

  if (authError || !authData.user) {
    console.error("[SignUp Confirm Error]", authError?.message);
    redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent(authError?.message || "Erreur lors de la création du compte.")}`)
  }

  const userId = authData.user.id;

  // Create profile with hardcoded role CUSTOMER
  await adminClient.from('profiles').upsert({
    id: userId,
    first_name: pendingData.first_name,
    last_name: pendingData.last_name,
    email: pendingData.email,
    phone_number: pendingData.phone,
    role: STRICT_ROLE, // IMMUTABLE: ONLY role CUSTOMER
  });

  // Create initial loyalty customer record (Bronze tier, 0 points)
  await adminClient.from('customers').upsert({
    id: userId,
    loyalty_points: 0,
    status: 'BRONZE',
  });

  // Clear cookie
  cookieStore.delete(PENDING_SIGNUP_COOKIE);

  // Automatically authenticate user with active session cookies
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: pendingData.email,
    password: pendingData.password,
  });

  if (!signInError) {
    redirect('/account');
  }

  redirect(`/login?success=${encodeURIComponent("Votre compte a été confirmé avec succès ! Vous pouvez maintenant vous connecter.")}`)
}

/**
 * Resends a fresh 6-digit confirmation OTP email
 */
export async function resendSignUpOtp(formData: FormData) {
  const emailParam = (formData.get('email') as string || '').trim();
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(PENDING_SIGNUP_COOKIE)?.value;

  if (!rawToken) {
    redirect(`/signup?message=${encodeURIComponent("Session expirée. Veuillez recommencer l'inscription.")}`)
  }

  const pendingData = verifySignedToken<PendingSignUpPayload>(rawToken);
  if (!pendingData) {
    redirect(`/signup?message=${encodeURIComponent("Session invalide. Veuillez recommencer.")}`)
  }

  const newOtp = generateSecureOtp();
  const newOtpHash = hashOtp(newOtp);
  const newExpiresAt = Date.now() + 15 * 60 * 1000;

  const emailResult = await emailService.sendVerificationOtp({
    email: pendingData.email,
    name: `${pendingData.first_name} ${pendingData.last_name}`,
    otp: newOtp,
    expiresInMinutes: 15,
  });

  if (!emailResult.success) {
    redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent("Impossible de renvoyer l'email pour le moment.")}`)
  }

  // Update cookie with new OTP hash
  const updatedPayload: PendingSignUpPayload = {
    ...pendingData,
    otpHash: newOtpHash,
    expiresAt: newExpiresAt,
  };

  cookieStore.set(PENDING_SIGNUP_COOKIE, createSignedToken(updatedPayload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  });

  redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&success=${encodeURIComponent("Un nouveau code a été envoyé à votre adresse email.")}`)
}
