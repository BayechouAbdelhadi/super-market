'use server'

import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email'
import {
  generateSecureOtp,
  hashOtp,
  createSignedToken,
  PENDING_RESET_COOKIE,
  PendingResetPayload,
} from '@/lib/email/otp-security'
import { z } from 'zod'

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
})

export async function requestPasswordReset(formData: FormData) {
  const emailRaw = formData.get('email') as string;
  const parseResult = ForgotPasswordSchema.safeParse({ email: emailRaw });

  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues?.[0]?.message || "Adresse email invalide.";
    redirect(`/forgot-password?message=${encodeURIComponent(errorMsg)}`);
  }

  const emailNormalized = parseResult.data.email.toLowerCase().trim();
  const supabase = await createClient();

  // Find user in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('email', emailNormalized)
    .single();

  const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined;

  // Retrieve origin for reset link
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  // Generate secure token payload (valid for 60 minutes)
  const RESET_EXPIRY_MINUTES = 60;
  const expiresAt = Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000;
  const resetToken = createSignedToken({ email: emailNormalized, expiresAt });
  let resetLink = `${origin}/reset-password?email=${encodeURIComponent(emailNormalized)}&token=${resetToken}`;

  // If SUPABASE_SERVICE_ROLE_KEY is configured, generate Supabase's native recovery link
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    try {
      const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js');
      const adminClient = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: emailNormalized,
        options: {
          redirectTo: `${origin}/reset-password`,
        },
      });
      if (!linkError && linkData?.properties?.action_link) {
        resetLink = linkData.properties.action_link;
      }
    } catch (adminErr) {
      console.warn("[ForgotPassword] Could not generate link via admin API:", adminErr);
    }
  } else {
    // Trigger Supabase built-in recovery token as well
    await supabase.auth.resetPasswordForEmail(emailNormalized, {
      redirectTo: `${origin}/reset-password`,
    }).catch(() => null);
  }

  // Send transactional email via Brevo with the button link
  const emailResult = await emailService.sendPasswordReset({
    email: emailNormalized,
    name,
    resetLink,
    expiresInMinutes: RESET_EXPIRY_MINUTES,
  });

  if (!emailResult.success) {
    console.error("[ForgotPassword] Brevo send error:", emailResult.error);
    redirect(`/forgot-password?message=${encodeURIComponent("Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer.")}`);
  }

  // Store signed reset token in cookie
  const cookieStore = await cookies();
  cookieStore.set(PENDING_RESET_COOKIE, resetToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: RESET_EXPIRY_MINUTES * 60,
    path: '/',
  });

  // Confirm email sent and stay on forgot-password confirmation view
  redirect(`/forgot-password?status=sent&email=${encodeURIComponent(emailNormalized)}`);
}
