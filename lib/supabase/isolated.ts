import { createClient } from '@supabase/supabase-js';

/**
 * Creates an isolated Supabase client that does NOT persist sessions
 * to cookies, localStorage, or memory singletons.
 * Used for creating user accounts (e.g. customers or cashiers) from server actions
 * or API routes without overwriting the caller's active session.
 */
export function createIsolatedClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
