'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("Supabase Login Error:", error.message)
    redirect('/login?message=Could not authenticate user')
  }

  const role = authData.user?.user_metadata?.role || 'CUSTOMER'
  const redirectPath = role === 'ADMIN' ? '/admin' : '/cashier'

  revalidatePath(redirectPath, 'layout')
  redirect(redirectPath)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
