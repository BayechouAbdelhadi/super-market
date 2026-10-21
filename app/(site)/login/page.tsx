import type { Metadata } from 'next'
import { AuthShell } from '@/components/public/AuthShell'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Connexion', robots: PRIVATE_PAGE_ROBOTS };
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; success?: string }>
}) {
  const params = await searchParams

  return (
    <AuthShell title="Bon retour parmi nous" description="Connectez-vous pour suivre vos points et vos remises fidélité.">
      <LoginForm initialMessage={params?.message} initialSuccess={params?.success} />
    </AuthShell>
  )
}
