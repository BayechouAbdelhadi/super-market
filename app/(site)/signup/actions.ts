'use server'

import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SupabaseUserAccountRepository } from '@/lib/auth/adapters/supabase-user-account-repository'
import { normalizePhone } from '@/lib/loyalty/domain'
import { emailService } from '@/lib/email'
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  createEncryptedToken,
  decryptToken,
  verifySignedToken,
  PENDING_SIGNUP_COOKIE,
} from '@/lib/email/otp-security'
import { PasswordSchema } from '@/lib/auth/password-rules'
import { authFailureMessage } from '@/lib/auth/auth-errors'
import { RATE_LIMITS, getClientIp, rateLimitMessage } from '@/lib/security/rate-limit'
import { enforceRateLimits } from '@/lib/security/enforce'
import { NEXT_PARAM, safeNextPath } from '@/lib/auth/redirect'
import { z } from 'zod'

export type SignUpActionResult = {
  success?: boolean
  error?: string | null
}

const accounts = new SupabaseUserAccountRepository()

const OtpCodeSchema = z.string().trim().regex(/^\d{6}$/)

const SignUpSchema = z.object({
  first_name: z.string().trim().min(2, "Le prénom est obligatoire (au moins 2 caractères)."),
  last_name: z.string().trim().min(2, "Le nom est obligatoire (au moins 2 caractères)."),
  email: z.string().trim().email("L'adresse email est obligatoire et doit être valide."),
  phone: z.string().trim().min(8, "Le numéro de téléphone est obligatoire (au moins 8 chiffres)."),
  password: PasswordSchema,
})

interface PendingSignUpPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  otpHash: string;
  expiresAt: number;
  /** Page to open once the account is confirmed (e.g. an arrival to reserve). */
  next?: string | null;
}

/**
 * Reads the pending signup cookie. It is encrypted because it carries the
 * chosen password; plain signed cookies issued before encryption are still
 * accepted until they expire (15 min).
 */
function readPendingSignUp(rawToken: string): PendingSignUpPayload | null {
  return decryptToken<PendingSignUpPayload>(rawToken) ?? verifySignedToken<PendingSignUpPayload>(rawToken)
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

  const ip = getClientIp(await headers())
  const limit = await enforceRateLimits([
    [`signup:ip:${ip}`, RATE_LIMITS.signupPerIp],
    [`signup:email:${emailNormalized}`, RATE_LIMITS.signupPerEmail],
  ])
  if (!limit.allowed) {
    return { error: rateLimitMessage(limit) }
  }

  // Verify that account does not already exist (service-role lookup: public signup has no session)
  const conflict = await accounts.findConflict(emailNormalized, phoneNormalized)

  if (conflict) {
    return {
      error: conflict === 'email'
        ? "Un compte existe déjà avec cette adresse email."
        : "Ce numéro de téléphone est déjà associé à un compte existant.",
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
    next: safeNextPath(formData.get(NEXT_PARAM)),
  };

  const signedToken = createEncryptedToken(payload);
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
  const emailParam = (formData.get('email') as string || '').trim();
  const codeResult = OtpCodeSchema.safeParse(formData.get('code') ?? '');
  const code = codeResult.success ? codeResult.data : '';

  if (!codeResult.success) {
    redirect(`/signup/verify?email=${encodeURIComponent(emailParam)}&message=${encodeURIComponent("Veuillez saisir un code à 6 chiffres valide.")}`)
  }

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(PENDING_SIGNUP_COOKIE)?.value;

  if (!rawToken) {
    redirect(`/signup?message=${encodeURIComponent("Session de confirmation expirée. Veuillez recommencer.")}`)
  }

  const pendingData = readPendingSignUp(rawToken);
  if (!pendingData) {
    redirect(`/signup?message=${encodeURIComponent("Jeton de confirmation invalide. Veuillez recommencer.")}`)
  }

  if (Date.now() > pendingData.expiresAt) {
    cookieStore.delete(PENDING_SIGNUP_COOKIE);
    redirect(`/signup?message=${encodeURIComponent("Le code de confirmation a expiré. Veuillez vous réinscrire.")}`)
  }

  // Verify OTP hash
  // Caps online guessing of the 6-digit code
  const verifyLimit = await enforceRateLimits([[`signup-otp:${pendingData.email}`, RATE_LIMITS.otpVerifyPerEmail]]);
  if (!verifyLimit.allowed) {
    redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent(rateLimitMessage(verifyLimit))}`)
  }

  if (!verifyOtpHash(code, pendingData.otpHash)) {
    redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent("Code de confirmation incorrect. Veuillez vérifier vos emails.")}`)
  }

  // STRICT SECURITY INVARIANT:
  // Public signup is strictly locked to role 'CUSTOMER'.
  // Under NO circumstances can 'ADMIN' or 'CASHIER' ever be created here.
  const STRICT_ROLE = 'CUSTOMER' as const;

  // Create the confirmed account (email verified by the OTP above), its profile
  // with the hardcoded CUSTOMER role, and the initial Bronze loyalty record.
  const created = await accounts.createAccount({
    email: pendingData.email,
    firstName: pendingData.first_name,
    lastName: pendingData.last_name,
    phone: pendingData.phone,
    role: STRICT_ROLE, // IMMUTABLE: ONLY role CUSTOMER
    password: pendingData.password,
  });

  if (!created.ok && created.reason === 'AUTH_FAILED') {
    redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent(authFailureMessage(created.code))}`)
  }

  if (!created.ok) {
    redirect(`/signup?message=${encodeURIComponent("Ce numéro de téléphone ou cette adresse email est déjà utilisé.")}`);
  }

  // Clear cookie
  cookieStore.delete(PENDING_SIGNUP_COOKIE);

  // Automatically authenticate user with active session cookies
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: pendingData.email,
    password: pendingData.password,
  });

  if (!signInError) {
    redirect(safeNextPath(pendingData.next) ?? '/account');
  }

  redirect(`/login?success=${encodeURIComponent("Votre compte a été confirmé avec succès ! Vous pouvez maintenant vous connecter.")}`)
}

/**
 * Resends a fresh 6-digit confirmation OTP email
 */
export async function resendSignUpOtp() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(PENDING_SIGNUP_COOKIE)?.value;

  if (!rawToken) {
    redirect(`/signup?message=${encodeURIComponent("Session expirée. Veuillez recommencer l'inscription.")}`)
  }

  const pendingData = readPendingSignUp(rawToken);
  if (!pendingData) {
    redirect(`/signup?message=${encodeURIComponent("Session invalide. Veuillez recommencer.")}`)
  }

  const resendLimit = await enforceRateLimits([[`signup-resend:${pendingData.email}`, RATE_LIMITS.otpResendPerEmail]]);
  if (!resendLimit.allowed) {
    redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&message=${encodeURIComponent(rateLimitMessage(resendLimit))}`)
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

  cookieStore.set(PENDING_SIGNUP_COOKIE, createEncryptedToken(updatedPayload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  });

  redirect(`/signup/verify?email=${encodeURIComponent(pendingData.email)}&success=${encodeURIComponent("Un nouveau code a été envoyé à votre adresse email.")}`)
}
