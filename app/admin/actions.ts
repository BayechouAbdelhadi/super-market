'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createIsolatedClient } from '@/lib/supabase/isolated'
import { z } from 'zod'

const CreateUserSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("L'adresse email est invalide."),
  phone_number: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  role: z.enum(['CUSTOMER', 'CASHIER', 'ADMIN']).default('CUSTOMER')
});

const EditUserSchema = z.object({
  user_id: z.string().uuid("L'ID de l'utilisateur est invalide."),
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  phone_number: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères.")
});

export async function createUser(formData: FormData) {
  const validatedFields = CreateUserSchema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    phone_number: formData.get('phone_number'),
    password: formData.get('password'),
    role: formData.get('role') || 'CUSTOMER'
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0]?.message || "Données invalides." };
  }

  const { first_name, last_name, email, phone_number, password, role } = validatedFields.data;

  // Verify caller's role for strict RBAC
  const supabaseServer = await createServerClient();
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser();

  if (!currentUser) {
    return { error: "Non autorisé. Veuillez vous connecter." };
  }

  const callerRole = currentUser?.user_metadata?.role || 'CUSTOMER';

  // Le caissier ne peut créer QUE des clients. L'admin peut créer n'importe quel rôle.
  if (callerRole === 'CASHIER' && role !== 'CUSTOMER') {
    return { error: "Accès refusé. Un caissier ne peut créer que des profils clients." };
  }

  if (callerRole !== 'ADMIN' && callerRole !== 'CASHIER') {
    return { error: "Accès refusé." };
  }

  const isolatedClient = createIsolatedClient();
  const { data, error } = await isolatedClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        phone_number,
        role
      }
    }
  });

  if (error) {
    console.error(`[Server Action] createUser Error (${email}):`, error);
    return { error: error.message };
  }

  // Revalidate paths
  revalidatePath('/admin/cashiers');
  revalidatePath('/admin/customers');
  revalidatePath('/cashier');
  
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

  const callerRole = currentUser?.user_metadata?.role || 'CUSTOMER';

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
