'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveUserRole } from '@/lib/auth/roles'
import { getAppOrigin } from '@/lib/utils/app-url'
import { emailService } from '@/lib/email'
import {
  createSignedToken,
  AccountActivationPayload,
} from '@/lib/email/otp-security'
import { normalizePhone } from '@/lib/loyalty/domain'
import { PasswordSchema } from '@/lib/auth/password-rules'
import { getAppSettings } from '@/lib/settings/service'
import { z } from 'zod'

const CreateUserSchema = z.object({
  first_name: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères."),
  last_name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().trim().email("L'adresse email est invalide."),
  phone_number: z.string().trim().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères."),
  password: z.union([PasswordSchema, z.literal(''), z.undefined()]),
  role: z.enum(['CUSTOMER', 'CASHIER', 'ADMIN']).default('CUSTOMER')
});

const EditUserSchema = z.object({
  user_id: z.string().uuid("L'ID de l'utilisateur est invalide."),
  first_name: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères."),
  last_name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  phone_number: z.string().trim().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères.")
});

export async function createUser(formData: FormData) {
  const validatedFields = CreateUserSchema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    phone_number: formData.get('phone_number'),
    password: formData.get('password') || undefined,
    role: formData.get('role') || 'CUSTOMER'
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0]?.message || "Données invalides." };
  }

  const { first_name, last_name, email, phone_number, password, role } = validatedFields.data;
  const phoneNormalized = normalizePhone(phone_number);
  const emailNormalized = email.toLowerCase().trim();
  const firstNameClean = first_name.trim();
  const lastNameClean = last_name.trim();

  // Verify caller's role for strict RBAC
  const supabaseServer = await createServerClient();
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser();

  if (!currentUser) {
    return { error: "Non autorisé. Veuillez vous connecter." };
  }

  const callerRole = await resolveUserRole(supabaseServer, currentUser);

  // Le caissier ne peut créer QUE des clients. L'admin peut créer n'importe quel rôle.
  if (callerRole === 'CASHIER' && role !== 'CUSTOMER') {
    return { error: "Accès refusé. Un caissier ne peut créer que des profils clients." };
  }

  if (callerRole !== 'ADMIN' && callerRole !== 'CASHIER') {
    return { error: "Accès refusé." };
  }

  const adminClient = createAdminClient();

  // Verify uniqueness of email and phone in profiles
  const { data: existingProfiles } = await adminClient
    .from('profiles')
    .select('id, email, phone_number')
    .or(`email.eq.${emailNormalized},phone_number.eq.${phoneNormalized}`)
    .limit(1);

  if (existingProfiles && existingProfiles.length > 0) {
    const isEmail = existingProfiles[0].email?.toLowerCase() === emailNormalized;
    return {
      error: isEmail
        ? "Un compte existe déjà avec cette adresse email."
        : "Un compte existe déjà avec ce numéro de téléphone.",
    };
  }

  // Generate secure initial password if not provided
  let securePassword = crypto.randomBytes(16).toString("hex") + "A1!";
  if (password && password.trim()) {
    const pwdCheck = PasswordSchema.safeParse(password.trim());
    if (!pwdCheck.success) {
      return { error: pwdCheck.error.issues[0]?.message || "Le mot de passe ne respecte pas les critères de sécurité." };
    }
    securePassword = password.trim();
  }

  // Create user with email_confirm: true via Supabase Admin API
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: emailNormalized,
    password: securePassword,
    email_confirm: true,
    user_metadata: {
      first_name: firstNameClean,
      last_name: lastNameClean,
      phone_number: phoneNormalized,
      role
    }
  });

  if (authError || !authData.user) {
    console.error(`[Server Action] createUser Error (${emailNormalized}):`, authError?.message);
    return { error: authError?.message || "Erreur lors de la création du compte." };
  }

  const userId = authData.user.id;

  // Insert profile
  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: userId,
    first_name: firstNameClean,
    last_name: lastNameClean,
    email: emailNormalized,
    phone_number: phoneNormalized,
    role
  });

  if (profileError) {
    console.error("[Server Action] Profile upsert error:", profileError.message);
    await adminClient.auth.admin.deleteUser(userId).catch(() => null);
    return { error: "Impossible de créer le profil (conflit de données)." };
  }

  // If role is CUSTOMER, create initial customer loyalty record
  if (role === 'CUSTOMER') {
    await adminClient.from('customers').upsert({
      id: userId,
      loyalty_points: 0,
      status: 'BRONZE'
    });
  }

  // Send activation/invitation email via Brevo
  let activationLink: string | undefined;
  try {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const token = createSignedToken<AccountActivationPayload>({
      email: emailNormalized,
      role,
      type: 'ACCOUNT_ACTIVATION',
      expiresAt,
    });

    const origin = getAppOrigin(await headers());
    activationLink = `${origin}/confirm-account?token=${encodeURIComponent(token)}`;

    const settings = await getAppSettings();
    const shouldSendEmail =
      role === 'CASHIER'
        ? settings.notifications.sendCashierInviteEmail
        : settings.notifications.sendWelcomeEmail;

    if (shouldSendEmail) {
      emailService.sendAccountActivation({
        email: emailNormalized,
        name: `${firstNameClean} ${lastNameClean}`,
        activationLink,
        role,
        expiresInDays: 7,
        sender: settings.notifications.senderEmail
          ? {
              email: settings.notifications.senderEmail,
              name: settings.notifications.senderName || settings.store.storeName,
            }
          : undefined,
      }).catch((err) => {
        console.error("[createUser] Brevo activation email failed:", err);
      });
    }
  } catch (emailErr) {
    console.error("[createUser] Error preparing activation email:", emailErr);
  }

  // Revalidate paths
  revalidatePath('/admin/cashiers');
  revalidatePath('/admin/customers');
  revalidatePath('/cashier');
  
  // SECURITY: the activation link is only ever delivered by email, never to the caller.
  return { success: true, role };
}

export async function createCashier(formData: FormData) {
  formData.set('role', 'CASHIER');
  const password = formData.get('password') as string;
  const result = await createUser(formData);
  if (result.error) {
    return { error: result.error };
  }
  return { success: true, password };
}

export async function editUser(formData: FormData) {
  const validatedFields = EditUserSchema.safeParse({
    user_id: formData.get('user_id'),
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    phone_number: formData.get('phone_number')
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0]?.message || "Données invalides." };
  }

  const { user_id, first_name, last_name, phone_number } = validatedFields.data;

  // To update profile metadata, we need the session to enforce RLS and check caller role
  const supabaseServer = await createServerClient();
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser();

  if (!currentUser) {
    return { error: "Non autorisé. Veuillez vous connecter." };
  }

  const callerRole = await resolveUserRole(supabaseServer, currentUser);

  // Le caissier ne peut modifier QUE des clients.
  if (callerRole === 'CASHIER') {
    const { data: targetProfile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    if (targetProfile && targetProfile.role !== 'CUSTOMER') {
      return { error: "Accès refusé. Un caissier ne peut modifier que des profils clients." };
    }
  } else if (callerRole !== 'ADMIN') {
    return { error: "Accès refusé." };
  }

  const { error } = await supabaseServer
    .from('profiles')
    .update({
      first_name,
      last_name,
      phone_number
    })
    .eq('id', user_id);

  if (error) {
    console.error(`[Server Action] editUser Error (${user_id}):`, error);
    return { error: error.message };
  }

  revalidatePath('/admin/cashiers');
  revalidatePath('/admin/customers');
  revalidatePath('/cashier');
  
  return { success: true };
}

const InviteUserSchema = z.object({
  email: z.string().trim().email("L'adresse email est invalide."),
  role: z.enum(['CUSTOMER', 'CASHIER']).default('CUSTOMER'),
  first_name: z.string().trim().optional().default(""),
  last_name: z.string().trim().optional().default(""),
  phone_number: z.string().trim().optional().default(""),
});

export async function inviteUser(formData: FormData) {
  const emailRaw = formData.get('email');
  const roleRaw = formData.get('role') || 'CUSTOMER';
  const firstNameRaw = formData.get('first_name') || '';
  const lastNameRaw = formData.get('last_name') || '';
  const phoneRaw = formData.get('phone_number') || '';

  const parsed = InviteUserSchema.safeParse({
    email: emailRaw,
    role: roleRaw,
    first_name: firstNameRaw,
    last_name: lastNameRaw,
    phone_number: phoneRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Données d'invitation invalides." };
  }

  const { email, role, first_name, last_name, phone_number } = parsed.data;
  const emailNormalized = email.toLowerCase().trim();

  // Verify caller's role for strict RBAC
  const supabaseServer = await createServerClient();
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser();

  if (!currentUser) {
    return { error: "Non autorisé. Veuillez vous connecter." };
  }

  const callerRole = await resolveUserRole(supabaseServer, currentUser);

  if (role === 'CASHIER' && callerRole !== 'ADMIN') {
    return { error: "Seul un administrateur peut inviter un membre en tant que caissier." };
  }

  if (callerRole !== 'ADMIN' && callerRole !== 'CASHIER') {
    return { error: "Accès refusé. Privilèges insuffisants pour inviter des utilisateurs." };
  }

  const adminClient = createAdminClient();

  // Check if profile already exists
  const { data: existingProfiles } = await adminClient
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('email', emailNormalized)
    .limit(1);

  const existingProfile = existingProfiles?.[0];

  // SECURITY: only an administrator may re-issue an activation link for a staff account.
  if (existingProfile && existingProfile.role !== 'CUSTOMER' && callerRole !== 'ADMIN') {
    return { error: "Accès refusé. Seul un administrateur peut réinviter un membre du personnel." };
  }

  const origin = getAppOrigin(await headers());
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  const token = createSignedToken<AccountActivationPayload>({
    email: emailNormalized,
    role: existingProfile?.role || role,
    type: 'ACCOUNT_ACTIVATION',
    expiresAt,
  });

  const activationLink = `${origin}/confirm-account?token=${encodeURIComponent(token)}`;

  if (existingProfile) {
    // User already exists, resend invitation/activation email
    try {
      const settings = await getAppSettings();
      const displayName = `${existingProfile.first_name || first_name || ''} ${existingProfile.last_name || last_name || ''}`.trim() || emailNormalized;
      
      await emailService.sendAccountActivation({
        email: emailNormalized,
        name: displayName,
        activationLink,
        role: existingProfile.role,
        expiresInDays: 7,
        sender: settings.notifications.senderEmail
          ? {
              email: settings.notifications.senderEmail,
              name: settings.notifications.senderName || settings.store.storeName,
            }
          : undefined,
      });

      return {
        success: true,
        alreadyExists: true,
        email: emailNormalized,
        role: existingProfile.role,
        message: `Un compte existe déjà pour ${emailNormalized}. Un nouvel e-mail d'activation a été envoyé avec succès !`,
      };
    } catch (err: any) {
      console.error("[inviteUser] Error sending re-activation email:", err);
      return {
        success: true,
        alreadyExists: true,
        email: emailNormalized,
        role: existingProfile.role,
        message: `Compte existant. Le lien d'invitation a été régénéré avec succès.`,
      };
    }
  }

  // Create new user using createUser action
  const createFormData = new FormData();
  createFormData.set('first_name', first_name || (role === 'CASHIER' ? 'Nouveau' : 'Client'));
  createFormData.set('last_name', last_name || (role === 'CASHIER' ? 'Caissier' : 'Fidélité'));
  createFormData.set('email', emailNormalized);
  const fallbackPhone = `06${crypto.randomBytes(4).readUInt32BE(0).toString().slice(0, 8)}`;
  createFormData.set('phone_number', phone_number || fallbackPhone);
  createFormData.set('role', role);

  const createResult = await createUser(createFormData);
  if (createResult.error) {
    return { error: createResult.error };
  }

  return {
    success: true,
    email: emailNormalized,
    role,
    message: `L'invitation a bien été envoyée par e-mail à ${emailNormalized} !`,
  };
}
