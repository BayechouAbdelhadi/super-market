'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/loyalty/domain'
import { emailService } from '@/lib/email'
import { generateSecureOtp, hashOtp, createSignedToken, verifySignedToken } from '@/lib/email/otp-security'
import { z } from 'zod'

const SignUpSchema = z.object({
  first_name: z.string().trim().min(2, "Le prénom doit comporter au moins 2 caractères."),
  last_name: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères."),
  email: z.string().trim().email("Adresse email invalide."),
  phone: z.string().trim().min(8, "Le numéro de téléphone doit comporter au moins 8 caractères."),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères."),
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

const PENDING_SIGNUP_COOKIE = 'sm_pending_signup';

/**
 * Step 1: User submits signup details.
 * Validates inputs, generates a 6-digit confirmation OTP,
 * sends it via Brevo email service, and redirects to OTP verification.
 */
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

  const supabase = await createClient()

  // Verify that account does not already exist
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .or(`email.eq.${emailNormalized},phone_number.eq.${phoneNormalized}`)
    .limit(1)

  if (existingUser && existingUser.length > 0) {
    redirect(`/signup?message=${encodeURIComponent("Un compte avec cet email ou numéro de téléphone existe déjà.")}`)
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
    redirect(`/signup?message=${encodeURIComponent("Impossible d'envoyer l'email de confirmation. Veuillez réessayer.")}`)
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

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: pendingData.email,
    password: pendingData.password,
    options: {
      data: {
        first_name: pendingData.first_name,
        last_name: pendingData.last_name,
        phone_number: pendingData.phone,
        role: STRICT_ROLE, // IMMUTABLE: ONLY role CUSTOMER
      },
    },
  });

  if (authError || !authData.user) {
    console.error("[SignUp Confirm Error]", authError?.message);
    redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent(authError?.message || "Erreur lors de la création du compte.")}`)
  }

  const userId = authData.user.id;

  // Create profile with hardcoded role CUSTOMER
  await supabase.from('profiles').upsert({
    id: userId,
    first_name: pendingData.first_name,
    last_name: pendingData.last_name,
    email: pendingData.email,
    phone_number: pendingData.phone,
    role: STRICT_ROLE, // IMMUTABLE: ONLY role CUSTOMER
  });

  // Create initial loyalty customer record (Bronze tier, 0 points)
  await supabase.from('customers').upsert({
    id: userId,
    loyalty_points: 0,
    status: 'BRONZE',
  });

  // Clear cookie
  cookieStore.delete(PENDING_SIGNUP_COOKIE);

  if (authData.session) {
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
