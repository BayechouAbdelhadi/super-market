'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getSessionCaller } from '@/lib/auth/session'
import { SupabaseUserAccountRepository } from '@/lib/auth/adapters/supabase-user-account-repository'
import { getAppOrigin } from '@/lib/utils/app-url'
import { emailService } from '@/lib/email'
import { createActivationLink } from '@/lib/auth/links'
import { AUTH_CONFIG } from '@/lib/auth/config'
import { normalizePhone } from '@/lib/loyalty/domain'
import { PasswordSchema } from '@/lib/auth/password-rules'
import { getAppSettings } from '@/lib/settings/service'
import { z } from 'zod'

const accounts = new SupabaseUserAccountRepository();

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
  const caller = await getSessionCaller();
  if (!caller.ok) {
    return { error: "Non autorisé. Veuillez vous connecter." };
  }
  const callerRole = caller.role;

  // Le caissier ne peut créer QUE des clients. L'admin peut créer n'importe quel rôle.
  if (callerRole === 'CASHIER' && role !== 'CUSTOMER') {
    return { error: "Accès refusé. Un caissier ne peut créer que des profils clients." };
  }

  if (callerRole !== 'ADMIN' && callerRole !== 'CASHIER') {
    return { error: "Accès refusé." };
  }

  // Verify uniqueness of email and phone in profiles
  const conflict = await accounts.findConflict(emailNormalized, phoneNormalized);
  if (conflict) {
    return {
      error: conflict === 'email'
        ? "Un compte existe déjà avec cette adresse email."
        : "Un compte existe déjà avec ce numéro de téléphone.",
    };
  }

  // Optional chosen password (a secure random one is generated otherwise)
  let chosenPassword: string | undefined;
  if (password && password.trim()) {
    const pwdCheck = PasswordSchema.safeParse(password.trim());
    if (!pwdCheck.success) {
      return { error: pwdCheck.error.issues[0]?.message || "Le mot de passe ne respecte pas les critères de sécurité." };
    }
    chosenPassword = password.trim();
  }

  const created = await accounts.createAccount({
    email: emailNormalized,
    firstName: firstNameClean,
    lastName: lastNameClean,
    phone: phoneNormalized,
    role,
    password: chosenPassword,
  });

  if (!created.ok) {
    return {
      error: created.reason === 'AUTH_FAILED'
        ? created.detail || "Erreur lors de la création du compte."
        : "Impossible de créer le profil (conflit de données).",
    };
  }

  // Send activation/invitation email via Brevo
  let activationLink: string | undefined;
  try {
    activationLink = createActivationLink(getAppOrigin(await headers()), emailNormalized, role);

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
        expiresInDays: AUTH_CONFIG.activationLinkTtlDays,
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
  const caller = await getSessionCaller();
  if (!caller.ok) {
    return { error: "Non autorisé. Veuillez vous connecter." };
  }
  const { supabase: supabaseServer, role: callerRole } = caller;

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
  const caller = await getSessionCaller();
  if (!caller.ok) {
    return { error: "Non autorisé. Veuillez vous connecter." };
  }
  const callerRole = caller.role;

  if (role === 'CASHIER' && callerRole !== 'ADMIN') {
    return { error: "Seul un administrateur peut inviter un membre en tant que caissier." };
  }

  if (callerRole !== 'ADMIN' && callerRole !== 'CASHIER') {
    return { error: "Accès refusé. Privilèges insuffisants pour inviter des utilisateurs." };
  }

  // Check if profile already exists
  const existingProfile = await accounts.findProfileByEmail(emailNormalized);

  // SECURITY: only an administrator may re-issue an activation link for a staff account.
  if (existingProfile && existingProfile.role !== 'CUSTOMER' && callerRole !== 'ADMIN') {
    return { error: "Accès refusé. Seul un administrateur peut réinviter un membre du personnel." };
  }

  const activationLink = createActivationLink(
    getAppOrigin(await headers()),
    emailNormalized,
    existingProfile?.role || role
  );

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
        expiresInDays: AUTH_CONFIG.activationLinkTtlDays,
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
    } catch (err) {
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
