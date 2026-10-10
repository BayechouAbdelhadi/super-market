import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase Admin Client.
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS) and perform privileged admin tasks.
 * 2. Must NEVER be prefixed with NEXT_PUBLIC_ (which would bundle it into client-side JS).
 * 3. Must NEVER be imported into or called from any Client Component ('use client').
 * 4. Must ONLY be executed in Server Actions ('use server') or Route Handlers.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY VIOLATION: createAdminClient cannot be executed on the client/browser.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Configuration error: Missing NEXT_PUBLIC_SUPABASE_URL in server environment');
  }

  if (!serviceRoleKey) {
    throw new Error('Configuration error: Missing SUPABASE_SERVICE_ROLE_KEY in server environment');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
